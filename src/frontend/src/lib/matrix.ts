import { Operation } from "@/backend";

export type Matrix = number[][];

export const MIN_DIM = 1;
export const MAX_DIM = 6;

/** Consistent rounding: 3 decimals, trailing zeros trimmed, -0 normalised. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 1000) / 1000;
  const normalised = Object.is(rounded, -0) ? 0 : rounded;
  return normalised.toFixed(3);
}

export function formatMatrix(matrix: Matrix): string {
  return matrix.map((row) => row.map(formatNumber).join("\t")).join("\n");
}

export function createMatrix(rows: number, cols: number, fill = 0): Matrix {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => fill),
  );
}

export function resizeMatrix(
  matrix: Matrix,
  rows: number,
  cols: number,
): Matrix {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => matrix[r]?.[c] ?? 0),
  );
}

export function cloneMatrix(matrix: Matrix): Matrix {
  return matrix.map((row) => [...row]);
}

export const SAMPLE_A: Matrix = [
  [3, 0, 2],
  [1, -2, 5],
  [4, 1, 2],
];

export const SAMPLE_B: Matrix = [
  [1, 2, 0],
  [0, 1, 3],
  [4, 0, 1],
];

export const SAMPLE_VECTOR: number[] = [1, 2, 3];

/** Design matrix for lasso regression: rows are observations, columns are features. */
export const SAMPLE_DESIGN: Matrix = [
  [1, 0.5],
  [1, 1.5],
  [1, 2.5],
  [1, 3.5],
  [1, 4.5],
];

/** Response vector for lasso regression: one value per observation. */
export const SAMPLE_RESPONSE: number[] = [2.1, 3.9, 6.2, 7.8, 10.1];

/**
 * Hardcoded demo dataset for the regularization walkthrough: six observations,
 * each an x with four features and a one-dimensional response y.
 */
export const DEMO_DESIGN: Matrix = [
  [1.0, 0.5, -0.2, 0.3],
  [1.4, 1.1, 0.1, -0.4],
  [2.1, 1.6, 0.4, 0.2],
  [2.6, 2.2, -0.3, 0.5],
  [3.2, 2.7, 0.2, -0.1],
  [3.9, 3.4, 0.6, 0.4],
];

export const DEMO_RESPONSE: number[] = [3.2, 4.6, 6.1, 7.4, 9.0, 10.8];

/** Feature labels for the demo design matrix columns. */
export const DEMO_FEATURES: string[] = ["x₁", "x₂", "x₃", "x₄"];

/**
 * Regularization strengths for the demo: λ = 0 is the ordinary linear model,
 * the rest are lasso fits at increasing strength.
 */
export const DEMO_LAMBDAS: number[] = [0, 0.1, 0.5, 1, 2];

export type OperationMeta = {
  id: Operation;
  label: string;
  /** "single" uses matrix A only; "binary" needs matrix B; "scalar" needs a scalar; "solve" needs vector b; "regression" needs a design matrix, response vector and λ. */
  kind: "single" | "binary" | "scalar" | "solve" | "regression";
  definition: string;
  example: string;
};

export const OPERATIONS: OperationMeta[] = [
  {
    id: Operation.determinant,
    label: "Determinant",
    kind: "single",
    definition:
      "The determinant det(A) is a scalar summarising how the linear map scales volume. A square matrix is invertible exactly when its determinant is non-zero.",
    example: "det([[3, 0, 2], [1, -2, 5], [4, 1, 2]]) = 42.000",
  },
  {
    id: Operation.inverse,
    label: "Inverse",
    kind: "single",
    definition:
      "The inverse A⁻¹ satisfies A·A⁻¹ = I. It exists only for square matrices with a non-zero determinant; a singular matrix has no inverse.",
    example: "For A = [[2, 0], [0, 4]], A⁻¹ = [[0.500, 0.000], [0.000, 0.250]]",
  },
  {
    id: Operation.transpose,
    label: "Transpose",
    kind: "single",
    definition:
      "The transpose Aᵀ swaps rows and columns, so entry (i, j) of Aᵀ equals entry (j, i) of A. An m×n matrix becomes n×m.",
    example: "[[1, 2, 3], [4, 5, 6]]ᵀ = [[1, 4], [2, 5], [3, 6]]",
  },
  {
    id: Operation.rank,
    label: "Rank",
    kind: "single",
    definition:
      "The rank is the number of linearly independent rows (or columns) — the dimension of the space the matrix maps onto.",
    example: "rank([[1, 2], [2, 4]]) = 1 (the second row is 2× the first)",
  },
  {
    id: Operation.trace,
    label: "Trace",
    kind: "single",
    definition:
      "The trace is the sum of the diagonal entries of a square matrix: tr(A) = Σ aᵢᵢ.",
    example: "tr([[3, 0, 2], [1, -2, 5], [4, 1, 2]]) = 3 + (−2) + 2 = 3.000",
  },
  {
    id: Operation.add,
    label: "Add",
    kind: "binary",
    definition:
      "Matrix addition adds corresponding entries. Both matrices must share the same dimensions.",
    example: "[[1, 2], [3, 4]] + [[5, 6], [7, 8]] = [[6, 8], [10, 12]]",
  },
  {
    id: Operation.subtract,
    label: "Subtract",
    kind: "binary",
    definition:
      "Matrix subtraction subtracts corresponding entries of B from A. Both matrices must share the same dimensions.",
    example: "[[5, 6], [7, 8]] − [[1, 2], [3, 4]] = [[4, 4], [4, 4]]",
  },
  {
    id: Operation.multiply,
    label: "Multiply",
    kind: "binary",
    definition:
      "Matrix product A·B is defined when the column count of A equals the row count of B; entry (i, j) is the dot product of row i of A with column j of B.",
    example: "[[1, 2], [3, 4]] · [[5, 6], [7, 8]] = [[19, 22], [43, 50]]",
  },
  {
    id: Operation.scalarMultiply,
    label: "Scalar ×",
    kind: "scalar",
    definition:
      "Scalar multiplication multiplies every entry of A by a single number k.",
    example: "3 · [[1, 2], [3, 4]] = [[3, 6], [9, 12]]",
  },
  {
    id: Operation.solve,
    label: "Solve Ax = b",
    kind: "solve",
    definition:
      "Solve the linear system Ax = b for the unknown vector x. The system has a unique solution when A is square and non-singular.",
    example: "A = [[2, 1], [1, 3]], b = [5, 10] → x = [1.000, 3.000]",
  },
  {
    id: Operation.lassoRegression,
    label: "Lasso regression",
    kind: "regression",
    definition:
      "Fit a linear model y ≈ Xβ + β₀ by minimising the residual sum of squares plus λ·Σ|βⱼ|. The regularization strength λ ≥ 0 shrinks coefficients toward zero — larger λ produces a sparser fit — while the intercept is left unpenalised.",
    example:
      "X = [[1, 0.5], [1, 1.5], [1, 2.5]], y = [2.1, 3.9, 6.2], λ = 0.1 → β = [1.900, 1.800], β₀ = 0.100",
  },
];

export function operationMeta(id: Operation): OperationMeta {
  return OPERATIONS.find((op) => op.id === id) ?? OPERATIONS[0];
}

/** Parse a cell string; returns null when it is not a finite number. */
export function parseCell(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}
