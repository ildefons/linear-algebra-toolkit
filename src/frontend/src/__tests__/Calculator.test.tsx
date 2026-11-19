import type { CalcRequest, CalcResult, backendInterface } from "@/backend";
import { Operation } from "@/backend";
import { DEMO_DESIGN, DEMO_LAMBDAS, DEMO_RESPONSE } from "@/lib/matrix";
import Calculator from "@/pages/Calculator";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithActor } from "./test-utils";

type CalculateMock = ReturnType<typeof vi.fn<backendInterface["calculate"]>>;

function makeActor(calculate: CalculateMock) {
  return { calculate } satisfies Pick<backendInterface, "calculate">;
}

/** A fake actor that answers with a fixed result and records each request. */
function actorReturning(result: CalcResult) {
  const calculate = vi.fn<backendInterface["calculate"]>(
    async (_request: CalcRequest) => structuredClone(result),
  );
  return { calculate, actor: makeActor(calculate) };
}

function cellInput(label: string, row: number, col: number) {
  return screen.getByLabelText(`${label} row ${row} column ${col}`);
}

function setCell(label: string, row: number, col: number, value: string) {
  fireEvent.change(cellInput(label, row, col), { target: { value } });
}

describe("Calculator", () => {
  it("renders the workbench and reference without a blank screen", () => {
    const { actor } = actorReturning({ __kind__: "scalar", scalar: 0 });
    renderWithActor(<Calculator />, actor);

    expect(
      screen.getByRole("heading", { name: "Matrix calculator" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Matrix A")).toBeInTheDocument();
    expect(screen.getByLabelText("Operations")).toBeInTheDocument();
    expect(screen.getByLabelText("Result")).toBeInTheDocument();
    expect(screen.getByLabelText("Operation reference")).toBeInTheDocument();
  });

  it("sends the entered matrix and selected operation, then shows the result", async () => {
    const user = userEvent.setup();
    const { calculate, actor } = actorReturning({
      __kind__: "scalar",
      scalar: -2,
    });
    renderWithActor(<Calculator />, actor);

    // Determinant is the default operation; shrink A to 2x2 and enter [[1,2],[3,4]].
    await user.click(screen.getByRole("button", { name: "Decrease rows" }));
    await user.click(screen.getByRole("button", { name: "Decrease cols" }));
    setCell("Matrix A", 1, 1, "1");
    setCell("Matrix A", 1, 2, "2");
    setCell("Matrix A", 2, 1, "3");
    setCell("Matrix A", 2, 2, "4");

    await user.click(screen.getByRole("button", { name: "Calculate" }));

    await waitFor(() => expect(calculate).toHaveBeenCalledTimes(1));
    expect(calculate.mock.calls[0][0]).toMatchObject({
      operation: Operation.determinant,
      matrix: [
        [1, 2],
        [3, 4],
      ],
    });
    expect(await screen.findByText("-2.000")).toBeInTheDocument();
  });

  it("shows a matrix result for transpose with clean formatting", async () => {
    const user = userEvent.setup();
    const { actor } = actorReturning({
      __kind__: "matrix",
      matrix: [
        [1, 4],
        [2, 5],
        [3, 6],
      ],
    });
    renderWithActor(<Calculator />, actor);

    await user.click(screen.getByRole("button", { name: "Transpose" }));
    await user.click(screen.getByRole("button", { name: "Calculate" }));

    const matrixValue = await screen.findByTestId("result.matrix_value");
    expect(within(matrixValue).getByText("1.000")).toBeInTheDocument();
    expect(within(matrixValue).getByText("6.000")).toBeInTheDocument();
  });

  it("rejects non-numeric input with an inline error and does not call the backend", async () => {
    const user = userEvent.setup();
    const { calculate, actor } = actorReturning({
      __kind__: "scalar",
      scalar: 0,
    });
    renderWithActor(<Calculator />, actor);

    setCell("Matrix A", 1, 1, "abc");
    await user.click(screen.getByRole("button", { name: "Calculate" }));

    expect(await screen.findByText("Enter a number")).toBeInTheDocument();
    expect(calculate).not.toHaveBeenCalled();
  });

  it("surfaces a backend error for a singular inverse instead of a result", async () => {
    const user = userEvent.setup();
    const { actor } = actorReturning({
      __kind__: "error",
      error: "Matrix is singular and has no inverse.",
    });
    renderWithActor(<Calculator />, actor);

    await user.click(screen.getByRole("button", { name: "Inverse" }));
    await user.click(screen.getByRole("button", { name: "Calculate" }));

    expect(
      await screen.findByText("Matrix is singular and has no inverse."),
    ).toBeInTheDocument();
  });

  it("reveals matrix B for a binary operation and sends both matrices", async () => {
    const user = userEvent.setup();
    const { calculate, actor } = actorReturning({
      __kind__: "matrix",
      matrix: [
        [19, 22],
        [43, 50],
      ],
    });
    renderWithActor(<Calculator />, actor);

    expect(screen.queryByLabelText("Matrix B")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Multiply" }));
    expect(screen.getByLabelText("Matrix B")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Calculate" }));

    await waitFor(() => expect(calculate).toHaveBeenCalledTimes(1));
    const request = calculate.mock.calls[0][0];
    expect(request.operation).toBe(Operation.multiply);
    expect(request.matrixB).toBeDefined();
  });

  it("copies the result to the clipboard", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const { actor } = actorReturning({ __kind__: "scalar", scalar: -2 });
    renderWithActor(<Calculator />, actor);

    await user.click(screen.getByRole("button", { name: "Calculate" }));
    await screen.findByText("-2.000");

    await user.click(
      screen.getByRole("button", { name: "Copy result to clipboard" }),
    );

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("-2.000"));
  });

  it("sends the scalar for scalar multiplication and shows the product", async () => {
    const user = userEvent.setup();
    const { calculate, actor } = actorReturning({
      __kind__: "matrix",
      matrix: [
        [3, 6],
        [9, 12],
      ],
    });
    renderWithActor(<Calculator />, actor);

    await user.click(screen.getByRole("button", { name: "Scalar ×" }));
    const scalarInput = screen.getByLabelText("Multiply every entry of A by");
    await user.clear(scalarInput);
    await user.type(scalarInput, "3");
    await user.click(screen.getByRole("button", { name: "Calculate" }));

    await waitFor(() => expect(calculate).toHaveBeenCalledTimes(1));
    expect(calculate.mock.calls[0][0]).toMatchObject({
      operation: Operation.scalarMultiply,
      scalar: 3,
    });
    const matrixValue = await screen.findByTestId("result.matrix_value");
    expect(within(matrixValue).getByText("12.000")).toBeInTheDocument();
  });

  it("solves Ax = b from the augmented vector input", async () => {
    const user = userEvent.setup();
    const { calculate, actor } = actorReturning({
      __kind__: "matrix",
      matrix: [[1, 3]],
    });
    renderWithActor(<Calculator />, actor);

    await user.click(screen.getByRole("button", { name: "Solve Ax = b" }));
    await user.click(screen.getByRole("button", { name: "Decrease rows" }));
    await user.click(screen.getByRole("button", { name: "Decrease cols" }));
    setCell("Matrix A", 1, 1, "2");
    setCell("Matrix A", 1, 2, "1");
    setCell("Matrix A", 2, 1, "1");
    setCell("Matrix A", 2, 2, "3");
    fireEvent.change(screen.getByLabelText("Vector b entry 1"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("Vector b entry 2"), {
      target: { value: "10" },
    });

    await user.click(screen.getByRole("button", { name: "Calculate" }));

    await waitFor(() => expect(calculate).toHaveBeenCalledTimes(1));
    expect(calculate.mock.calls[0][0]).toMatchObject({
      operation: Operation.solve,
      vector: [5, 10],
    });
    const matrixValue = await screen.findByTestId("result.matrix_value");
    expect(within(matrixValue).getByText("1.000")).toBeInTheDocument();
    expect(within(matrixValue).getByText("3.000")).toBeInTheDocument();
  });

  it("surfaces a backend error for mismatched addition dimensions", async () => {
    const user = userEvent.setup();
    const { actor } = actorReturning({
      __kind__: "error",
      error: "Matrices must have the same dimensions for addition.",
    });
    renderWithActor(<Calculator />, actor);

    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "Calculate" }));

    expect(
      await screen.findByText(
        "Matrices must have the same dimensions for addition.",
      ),
    ).toBeInTheDocument();
  });

  it("sends both matrices for subtraction", async () => {
    const user = userEvent.setup();
    const { calculate, actor } = actorReturning({
      __kind__: "matrix",
      matrix: [
        [4, 4],
        [4, 4],
      ],
    });
    renderWithActor(<Calculator />, actor);

    await user.click(screen.getByRole("button", { name: "Subtract" }));
    await user.click(screen.getByRole("button", { name: "Calculate" }));

    await waitFor(() => expect(calculate).toHaveBeenCalledTimes(1));
    const request = calculate.mock.calls[0][0];
    expect(request.operation).toBe(Operation.subtract);
    expect(request.matrixB).toBeDefined();
  });

  it("shows a scalar result for rank and trace", async () => {
    const user = userEvent.setup();
    const { calculate, actor } = actorReturning({
      __kind__: "scalar",
      scalar: 1,
    });
    renderWithActor(<Calculator />, actor);

    await user.click(screen.getByRole("button", { name: "Rank" }));
    await user.click(screen.getByRole("button", { name: "Calculate" }));

    await waitFor(() => expect(calculate).toHaveBeenCalledTimes(1));
    expect(calculate.mock.calls[0][0].operation).toBe(Operation.rank);
    expect(await screen.findByText("1.000")).toBeInTheDocument();
  });

  it("lists every supported operation with a worked example in the reference", () => {
    const { actor } = actorReturning({ __kind__: "scalar", scalar: 0 });
    renderWithActor(<Calculator />, actor);

    const reference = screen.getByLabelText("Operation reference");
    expect(within(reference).getByText("Determinant")).toBeInTheDocument();
    expect(within(reference).getByText("Inverse")).toBeInTheDocument();
    expect(within(reference).getByText("Transpose")).toBeInTheDocument();
    expect(within(reference).getByText("Rank")).toBeInTheDocument();
    expect(within(reference).getByText("Trace")).toBeInTheDocument();
    expect(within(reference).getByText("Add")).toBeInTheDocument();
    expect(within(reference).getByText("Subtract")).toBeInTheDocument();
    expect(within(reference).getByText("Multiply")).toBeInTheDocument();
    expect(within(reference).getByText("Scalar ×")).toBeInTheDocument();
    expect(within(reference).getByText("Solve Ax = b")).toBeInTheDocument();
    expect(
      within(reference).getAllByText("Example").length,
    ).toBeGreaterThanOrEqual(10);
  });

  it("adds and removes rows and columns through the steppers", async () => {
    const user = userEvent.setup();
    const { actor } = actorReturning({ __kind__: "scalar", scalar: 0 });
    renderWithActor(<Calculator />, actor);

    // Sample A starts at 3x3; grow to 4x4 then shrink back to 2x2.
    await user.click(screen.getByRole("button", { name: "Increase rows" }));
    await user.click(screen.getByRole("button", { name: "Increase cols" }));
    expect(cellInput("Matrix A", 4, 4)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Decrease rows" }));
    await user.click(screen.getByRole("button", { name: "Decrease rows" }));
    await user.click(screen.getByRole("button", { name: "Decrease cols" }));
    await user.click(screen.getByRole("button", { name: "Decrease cols" }));
    expect(cellInput("Matrix A", 2, 2)).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Matrix A row 3 column 1"),
    ).not.toBeInTheDocument();
  });

  it("keeps every existing matrix operation selectable in the workbench", () => {
    const { actor } = actorReturning({ __kind__: "scalar", scalar: 0 });
    renderWithActor(<Calculator />, actor);

    const operations = screen.getByLabelText("Operations");
    for (const label of [
      "Determinant",
      "Inverse",
      "Transpose",
      "Rank",
      "Trace",
      "Add",
      "Subtract",
      "Multiply",
      "Scalar ×",
      "Solve Ax = b",
    ]) {
      expect(
        within(operations).getByRole("button", { name: label }),
      ).toBeInTheDocument();
    }
  });

  it("defaults to Determinant with only matrix A and no extra inputs", () => {
    const { actor } = actorReturning({ __kind__: "scalar", scalar: 0 });
    renderWithActor(<Calculator />, actor);

    expect(screen.getByRole("button", { name: "Determinant" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByLabelText("Matrix A")).toBeInTheDocument();
    expect(screen.queryByLabelText("Matrix B")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Scalar")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Vector b")).not.toBeInTheDocument();
  });

  it("hides the scalar panel when switching from a scalar to a single operation", async () => {
    const user = userEvent.setup();
    const { actor } = actorReturning({ __kind__: "scalar", scalar: 0 });
    renderWithActor(<Calculator />, actor);

    await user.click(screen.getByRole("button", { name: "Scalar ×" }));
    expect(screen.getByLabelText("Scalar")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Trace" }));
    expect(screen.queryByLabelText("Scalar")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Matrix B")).not.toBeInTheDocument();
  });

  it("clears a previous result when a different operation is selected", async () => {
    const user = userEvent.setup();
    const { actor } = actorReturning({ __kind__: "scalar", scalar: -2 });
    renderWithActor(<Calculator />, actor);

    await user.click(screen.getByRole("button", { name: "Calculate" }));
    expect(await screen.findByText("-2.000")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Rank" }));
    expect(screen.queryByText("-2.000")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Choose an operation and press Calculate to see the result here.",
      ),
    ).toBeInTheDocument();
  });

  it("labels the result panel with the selected operation", async () => {
    const user = userEvent.setup();
    const { actor } = actorReturning({ __kind__: "scalar", scalar: 1 });
    renderWithActor(<Calculator />, actor);

    await user.click(screen.getByRole("button", { name: "Trace" }));
    expect(screen.getByText("Result — Trace")).toBeInTheDocument();
  });

  it("reveals the regression inputs and hides other-operation inputs for lasso", async () => {
    const user = userEvent.setup();
    const { actor } = actorReturning({ __kind__: "scalar", scalar: 0 });
    renderWithActor(<Calculator />, actor);

    await user.click(screen.getByRole("button", { name: "Lasso regression" }));

    expect(screen.getByLabelText("Design matrix X")).toBeInTheDocument();
    expect(screen.getByLabelText("Regression inputs")).toBeInTheDocument();
    expect(screen.getByLabelText("Response y entry 1")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Regularization strength λ (≥ 0)"),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Matrix B")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Scalar")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Vector b")).not.toBeInTheDocument();
  });

  it("sends the design matrix, response vector and lambda for lasso regression", async () => {
    const user = userEvent.setup();
    const { calculate, actor } = actorReturning({
      __kind__: "regression",
      regression: {
        coefficients: [1.9, 1.8],
        intercept: 0.1,
        iterations: 5n,
        converged: true,
        residualSumOfSquares: 0.02,
      },
    });
    renderWithActor(<Calculator />, actor);

    await user.click(screen.getByRole("button", { name: "Lasso regression" }));
    await user.click(screen.getByRole("button", { name: "Load sample" }));
    for (const [index, value] of [2.1, 3.9, 6.2, 7.8, 10.1].entries()) {
      fireEvent.change(screen.getByLabelText(`Response y entry ${index + 1}`), {
        target: { value: String(value) },
      });
    }
    await user.click(screen.getByRole("button", { name: "Calculate" }));

    await waitFor(() => expect(calculate).toHaveBeenCalledTimes(1));
    const request = calculate.mock.calls[0][0];
    expect(request.operation).toBe(Operation.lassoRegression);
    expect(request.matrix).toEqual([
      [1, 0.5],
      [1, 1.5],
      [1, 2.5],
      [1, 3.5],
      [1, 4.5],
    ]);
    expect(request.vector).toEqual([2.1, 3.9, 6.2, 7.8, 10.1]);
    expect(request.lambda).toBe(0.1);
  });

  it("renders the regression result with coefficients, intercept, iterations, convergence and RSS", async () => {
    const user = userEvent.setup();
    const { actor } = actorReturning({
      __kind__: "regression",
      regression: {
        coefficients: [1.9, 1.8],
        intercept: 0.1,
        iterations: 5n,
        converged: true,
        residualSumOfSquares: 0.02,
      },
    });
    renderWithActor(<Calculator />, actor);

    await user.click(screen.getByRole("button", { name: "Lasso regression" }));
    await user.click(screen.getByRole("button", { name: "Calculate" }));

    const regression = await screen.findByTestId("result.regression_value");
    expect(within(regression).getByText("Coefficients")).toBeInTheDocument();
    expect(within(regression).getByText("1.900")).toBeInTheDocument();
    expect(within(regression).getByText("1.800")).toBeInTheDocument();
    expect(within(regression).getByText("Intercept")).toBeInTheDocument();
    expect(
      within(regression).getByTestId("result.regression_intercept"),
    ).toHaveTextContent("0.100");
    expect(
      within(regression).getByTestId("result.regression_iterations"),
    ).toHaveTextContent("5");
    expect(
      within(regression).getByTestId("result.regression_converged"),
    ).toHaveTextContent("Yes");
    expect(
      within(regression).getByTestId("result.regression_rss"),
    ).toHaveTextContent("0.020");
  });

  it("surfaces a backend validation error for a mismatched response length", async () => {
    const user = userEvent.setup();
    const { actor } = actorReturning({
      __kind__: "error",
      error: "Response vector length must equal the number of observations.",
    });
    renderWithActor(<Calculator />, actor);

    await user.click(screen.getByRole("button", { name: "Lasso regression" }));
    await user.click(screen.getByRole("button", { name: "Calculate" }));

    expect(
      await screen.findByText(
        "Response vector length must equal the number of observations.",
      ),
    ).toBeInTheDocument();
  });

  it("rejects a non-numeric lambda before calling the backend", async () => {
    const user = userEvent.setup();
    const { calculate, actor } = actorReturning({
      __kind__: "regression",
      regression: {
        coefficients: [0],
        intercept: 0,
        iterations: 1n,
        converged: true,
        residualSumOfSquares: 0,
      },
    });
    renderWithActor(<Calculator />, actor);

    await user.click(screen.getByRole("button", { name: "Lasso regression" }));
    const lambdaInput = screen.getByLabelText(
      "Regularization strength λ (≥ 0)",
    );
    await user.clear(lambdaInput);
    await user.type(lambdaInput, "abc");
    await user.click(screen.getByRole("button", { name: "Calculate" }));

    expect(
      await screen.findByText("Enter a valid regularization strength (λ ≥ 0)."),
    ).toBeInTheDocument();
    expect(calculate).not.toHaveBeenCalled();
  });

  it("lists Lasso regression with a definition and worked example in the reference", () => {
    const { actor } = actorReturning({ __kind__: "scalar", scalar: 0 });
    renderWithActor(<Calculator />, actor);

    const reference = screen.getByLabelText("Operation reference");
    expect(within(reference).getByText("Lasso regression")).toBeInTheDocument();
    expect(
      within(reference).getByText(/minimising the residual sum of squares/),
    ).toBeInTheDocument();
    expect(
      within(reference).getAllByText("Example").length,
    ).toBeGreaterThanOrEqual(11);
  });

  it("embeds the regularization demo collapsed and does not fit on page load", () => {
    const { calculate, actor } = actorReturning({
      __kind__: "scalar",
      scalar: 0,
    });
    renderWithActor(<Calculator />, actor);

    // The demo section is present but its content is hidden until expanded.
    expect(
      screen.getByRole("region", { name: "Regularization demo" }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("demo.dataset.table")).not.toBeInTheDocument();
    expect(screen.queryByTestId("demo.fits.table")).not.toBeInTheDocument();

    // The embedded demo must not fire backend calls on page load.
    expect(calculate).not.toHaveBeenCalled();
  });

  it("runs the demo fits when the embedded demo is expanded", async () => {
    const user = userEvent.setup();
    const { calculate, actor } = actorReturning({
      __kind__: "regression",
      regression: {
        coefficients: [1, 0.5, 0.25, 0.1],
        intercept: 0.5,
        iterations: 7n,
        converged: true,
        residualSumOfSquares: 0.1,
      },
    });
    renderWithActor(<Calculator />, actor);

    expect(calculate).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "Show worked example" }),
    );

    // One lasso request per demo lambda, all through the lasso operation.
    await waitFor(() =>
      expect(calculate).toHaveBeenCalledTimes(DEMO_LAMBDAS.length),
    );
    for (const call of calculate.mock.calls) {
      expect(call[0]).toMatchObject({
        operation: Operation.lassoRegression,
        matrix: DEMO_DESIGN,
        vector: DEMO_RESPONSE,
      });
    }
    expect(calculate.mock.calls.map((call) => call[0].lambda)).toEqual(
      DEMO_LAMBDAS,
    );

    // The dataset and the ordinary/lasso fits become visible together.
    expect(await screen.findByTestId("demo.dataset.table")).toBeInTheDocument();
    const fits = await screen.findByTestId("demo.fits.table");
    expect(within(fits).getByTestId("demo.fits.row.0")).toBeInTheDocument();
    expect(within(fits).getByTestId("demo.fits.row.2")).toBeInTheDocument();
  });
});
