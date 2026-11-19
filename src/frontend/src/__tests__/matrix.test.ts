import {
  createMatrix,
  formatMatrix,
  formatNumber,
  parseCell,
  resizeMatrix,
} from "@/lib/matrix";
import { describe, expect, it } from "vitest";

describe("formatNumber", () => {
  it("rounds to three decimals with consistent trailing zeros", () => {
    expect(formatNumber(-2)).toBe("-2.000");
    expect(formatNumber(0.5)).toBe("0.500");
    expect(formatNumber(1 / 3)).toBe("0.333");
  });

  it("normalises negative zero and non-finite values", () => {
    expect(formatNumber(-0)).toBe("0.000");
    expect(formatNumber(Number.NaN)).toBe("—");
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe("—");
  });
});

describe("formatMatrix", () => {
  it("formats every entry with the shared rounding", () => {
    expect(
      formatMatrix([
        [1, 2],
        [3, 4],
      ]),
    ).toBe("1.000\t2.000\n3.000\t4.000");
  });
});

describe("parseCell", () => {
  it("accepts finite numbers and trims whitespace", () => {
    expect(parseCell(" 3.5 ")).toBe(3.5);
    expect(parseCell("-2")).toBe(-2);
  });

  it("rejects blank and non-numeric entries", () => {
    expect(parseCell("")).toBeNull();
    expect(parseCell("abc")).toBeNull();
    expect(parseCell("Infinity")).toBeNull();
  });
});

describe("resizeMatrix", () => {
  it("preserves existing entries and fills new cells with zero", () => {
    expect(
      resizeMatrix(
        [
          [1, 2],
          [3, 4],
        ],
        3,
        3,
      ),
    ).toEqual([
      [1, 2, 0],
      [3, 4, 0],
      [0, 0, 0],
    ]);
  });

  it("truncates when shrinking", () => {
    expect(
      resizeMatrix(
        [
          [1, 2, 3],
          [4, 5, 6],
        ],
        1,
        2,
      ),
    ).toEqual([[1, 2]]);
  });
});

describe("createMatrix", () => {
  it("builds a zero-filled matrix of the requested shape", () => {
    expect(createMatrix(2, 3)).toEqual([
      [0, 0, 0],
      [0, 0, 0],
    ]);
  });
});
