import { PocketIc } from "@dfinity/pic";
import type { Actor, CanisterFixture } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let actor: Actor<_SERVICE>;
let canisterId: CanisterFixture<_SERVICE>["canisterId"];

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor, canisterId } = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
  }));
});

afterAll(async () => {
  await pic?.tearDown();
});

it("returns the determinant of a 2x2 matrix", async () => {
  const result = await actor.calculate({
    operation: { determinant: null },
    matrix: [
      [1, 2],
      [3, 4],
    ],
    matrixB: [],
    scalar: [],
    vector: [],
    lambda: [],
  });
  expect(result).toEqual({ scalar: -2 });
});

it("returns the inverse of a diagonal matrix", async () => {
  const result = await actor.calculate({
    operation: { inverse: null },
    matrix: [
      [2, 0],
      [0, 2],
    ],
    matrixB: [],
    scalar: [],
    vector: [],
    lambda: [],
  });
  expect(result).toEqual({
    matrix: [
      [0.5, 0],
      [0, 0.5],
    ],
  });
});

it("multiplies two matrices", async () => {
  const result = await actor.calculate({
    operation: { multiply: null },
    matrix: [
      [1, 2],
      [3, 4],
    ],
    matrixB: [
      [
        [5, 6],
        [7, 8],
      ],
    ],
    scalar: [],
    vector: [],
    lambda: [],
  });
  expect(result).toEqual({
    matrix: [
      [19, 22],
      [43, 50],
    ],
  });
});

it("transposes a rectangular matrix", async () => {
  const result = await actor.calculate({
    operation: { transpose: null },
    matrix: [
      [1, 2, 3],
      [4, 5, 6],
    ],
    matrixB: [],
    scalar: [],
    vector: [],
    lambda: [],
  });
  expect(result).toEqual({
    matrix: [
      [1, 4],
      [2, 5],
      [3, 6],
    ],
  });
});

it("reports an error for the inverse of a singular matrix", async () => {
  const result = await actor.calculate({
    operation: { inverse: null },
    matrix: [
      [1, 2],
      [2, 4],
    ],
    matrixB: [],
    scalar: [],
    vector: [],
    lambda: [],
  });
  expect(result).toHaveProperty("error");
});

it("reports an error for mismatched addition dimensions", async () => {
  const result = await actor.calculate({
    operation: { add: null },
    matrix: [
      [1, 2],
      [3, 4],
    ],
    matrixB: [[[1, 2, 3]]],
    scalar: [],
    vector: [],
    lambda: [],
  });
  expect(result).toHaveProperty("error");
});

it("solves a linear system Ax = b", async () => {
  const result = await actor.calculate({
    operation: { solve: null },
    matrix: [
      [2, 1],
      [1, 3],
    ],
    matrixB: [],
    scalar: [],
    vector: [[5, 10]],
    lambda: [],
  });
  expect(result).toEqual({ matrix: [[1, 3]] });
});

it("fits lasso regression with coefficients close to the true relationship", async () => {
  const result = await actor.calculate({
    operation: { lassoRegression: null },
    matrix: [
      [1, 0.5],
      [1, 1.5],
      [1, 2.5],
    ],
    matrixB: [],
    scalar: [],
    vector: [[2.1, 3.9, 6.2]],
    lambda: [0.1],
  });
  expect(result).toHaveProperty("regression");
  if ("regression" in result) {
    const fit = result.regression;
    expect(fit.coefficients).toHaveLength(2);
    expect(fit.coefficients[0]).toBeCloseTo(1.9, 1);
    expect(fit.coefficients[1]).toBeCloseTo(1.8, 1);
    expect(fit.intercept).toBeCloseTo(0.1, 1);
    expect(fit.converged).toBe(true);
    expect(fit.iterations).toBeGreaterThan(0n);
    expect(fit.residualSumOfSquares).toBeGreaterThanOrEqual(0);
  }
});

it("shrinks coefficient magnitudes as lambda increases", async () => {
  const request = (lambda: number) => ({
    operation: { lassoRegression: null } as const,
    matrix: [
      [1, 0.5],
      [1, 1.5],
      [1, 2.5],
      [1, 3.5],
      [1, 4.5],
    ],
    matrixB: [],
    scalar: [],
    vector: [[2.1, 3.9, 6.2, 7.8, 10.1]],
    lambda: [lambda],
  });
  const small = await actor.calculate(request(0.1));
  const large = await actor.calculate(request(5));
  expect(small).toHaveProperty("regression");
  expect(large).toHaveProperty("regression");
  if ("regression" in small && "regression" in large) {
    const smallNorm = small.regression.coefficients.reduce(
      (sum, c) => sum + Math.abs(c),
      0,
    );
    const largeNorm = large.regression.coefficients.reduce(
      (sum, c) => sum + Math.abs(c),
      0,
    );
    expect(largeNorm).toBeLessThan(smallNorm);
  }
});

it("reports an error for a response vector with the wrong length", async () => {
  const result = await actor.calculate({
    operation: { lassoRegression: null },
    matrix: [
      [1, 0.5],
      [1, 1.5],
      [1, 2.5],
    ],
    matrixB: [],
    scalar: [],
    vector: [[2.1, 3.9]],
    lambda: [0.1],
  });
  expect(result).toHaveProperty("error");
});

it("reports an error for a negative regularization strength", async () => {
  const result = await actor.calculate({
    operation: { lassoRegression: null },
    matrix: [
      [1, 0.5],
      [1, 1.5],
      [1, 2.5],
    ],
    matrixB: [],
    scalar: [],
    vector: [[2.1, 3.9, 6.2]],
    lambda: [-1],
  });
  expect(result).toHaveProperty("error");
});
