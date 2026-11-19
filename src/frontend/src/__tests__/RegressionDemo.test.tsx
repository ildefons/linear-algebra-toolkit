import type { CalcRequest, CalcResult, backendInterface } from "@/backend";
import { Operation } from "@/backend";
import { RegressionDemo } from "@/components/RegressionDemo";
import { DEMO_DESIGN, DEMO_LAMBDAS, DEMO_RESPONSE } from "@/lib/matrix";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithActor } from "./test-utils";

type CalculateMock = ReturnType<typeof vi.fn<backendInterface["calculate"]>>;

function makeActor(calculate: CalculateMock) {
  return { calculate } satisfies Pick<backendInterface, "calculate">;
}

/** A fit whose coefficients shrink as lambda grows, for the demo's five lambdas. */
function fitForLambda(lambda: number) {
  const shrink = 1 / (1 + lambda);
  return {
    coefficients: [2 * shrink, 1.5 * shrink, 0.5 * shrink, 0.25 * shrink],
    intercept: 0.5,
    iterations: 7n,
    converged: true,
    residualSumOfSquares: 0.1 + lambda,
  };
}

/** A fake actor that answers each lasso request with a lambda-dependent fit. */
function actorFitting() {
  const calculate = vi.fn<backendInterface["calculate"]>(
    async (request: CalcRequest): Promise<CalcResult> => ({
      __kind__: "regression",
      regression: fitForLambda(request.lambda ?? 0),
    }),
  );
  return { calculate, actor: makeActor(calculate) };
}

describe("RegressionDemo", () => {
  it("renders the hardcoded dataset of six 4-feature observations with a response", () => {
    const { actor } = actorFitting();
    renderWithActor(<RegressionDemo />, actor);

    const dataset = screen.getByTestId("demo.dataset.table");
    expect(within(dataset).getByText("x₁")).toBeInTheDocument();
    expect(within(dataset).getByText("x₄")).toBeInTheDocument();
    expect(within(dataset).getByText("y")).toBeInTheDocument();

    // Six observation rows, each with four feature cells and one response cell.
    for (let row = 1; row <= 6; row += 1) {
      expect(screen.getByTestId(`demo.dataset.row.${row}`)).toBeInTheDocument();
    }
    expect(screen.queryByTestId("demo.dataset.row.7")).not.toBeInTheDocument();

    // The first observation's four features and response are shown rounded.
    const firstRow = screen.getByTestId("demo.dataset.row.1");
    for (const value of DEMO_DESIGN[0]) {
      expect(within(firstRow).getByText(value.toFixed(3))).toBeInTheDocument();
    }
    expect(
      within(firstRow).getByText(DEMO_RESPONSE[0].toFixed(3)),
    ).toBeInTheDocument();
  });

  it("runs the ordinary and lasso fits automatically and shows them together", async () => {
    const { calculate, actor } = actorFitting();
    renderWithActor(<RegressionDemo />, actor);

    const fits = await screen.findByTestId("demo.fits.table");

    // One request per lambda, all through the lasso regression operation.
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

    // The ordinary fit (lambda = 0) and each lasso fit are labelled and shown.
    const ordinaryRow = within(fits).getByTestId("demo.fits.row.0");
    expect(within(ordinaryRow).getByText("Ordinary")).toBeInTheDocument();
    for (const lambda of DEMO_LAMBDAS.filter((value) => value > 0)) {
      const row = within(fits).getByTestId(`demo.fits.row.${lambda}`);
      expect(within(row).getByText("Lasso")).toBeInTheDocument();
    }
  });

  it("shows coefficients, intercept, convergence and RSS rounded to three decimals", async () => {
    const { actor } = actorFitting();
    renderWithActor(<RegressionDemo />, actor);

    const fits = await screen.findByTestId("demo.fits.table");
    const ordinaryRow = within(fits).getByTestId("demo.fits.row.0");

    // Cells: λ, Model, β1..β4, β₀, RSS, Conv.
    const cells = within(ordinaryRow).getAllByRole("cell");
    expect(cells[0]).toHaveTextContent("0.000");
    expect(cells[1]).toHaveTextContent("Ordinary");
    // lambda = 0: coefficients [2, 1.5, 0.5, 0.25], intercept 0.5, RSS 0.1.
    expect(cells[2]).toHaveTextContent("2.000");
    expect(cells[3]).toHaveTextContent("1.500");
    expect(cells[4]).toHaveTextContent("0.500");
    expect(cells[5]).toHaveTextContent("0.250");
    expect(cells[6]).toHaveTextContent("0.500");
    expect(cells[7]).toHaveTextContent("0.100");
    expect(cells[8]).toHaveTextContent("Yes");
  });

  it("shows coefficient shrinkage as lambda increases", async () => {
    const { actor } = actorFitting();
    renderWithActor(<RegressionDemo />, actor);

    const fits = await screen.findByTestId("demo.fits.table");
    const ordinaryRow = within(fits).getByTestId("demo.fits.row.0");
    const strongRow = within(fits).getByTestId("demo.fits.row.2");

    // The first coefficient cell is 2.000 at lambda = 0 and 0.667 at lambda = 2.
    const ordinaryCells = within(ordinaryRow).getAllByRole("cell");
    const strongCells = within(strongRow).getAllByRole("cell");
    expect(ordinaryCells[2]).toHaveTextContent("2.000");
    expect(strongCells[2]).toHaveTextContent("0.667");
    expect(strongCells[2]).not.toHaveTextContent("2.000");
  });

  it("shows a loading state while the fits are running", async () => {
    const resolvers: Array<(result: CalcResult) => void> = [];
    const calculate = vi.fn<backendInterface["calculate"]>(
      () =>
        new Promise<CalcResult>((resolve) => {
          resolvers.push(resolve);
        }),
    );
    renderWithActor(<RegressionDemo />, makeActor(calculate));

    expect(screen.getByTestId("demo.loading_state")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Fitting/ })).toBeDisabled();

    // Resolve each of the five sequential fits so the demo reaches its ready state.
    for (let index = 0; index < DEMO_LAMBDAS.length; index += 1) {
      await waitFor(() => expect(resolvers.length).toBeGreaterThan(index));
      resolvers[index]({
        __kind__: "regression",
        regression: fitForLambda(DEMO_LAMBDAS[index]),
      });
    }

    await waitFor(() =>
      expect(
        screen.queryByTestId("demo.loading_state"),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByTestId("demo.fits.table")).toBeInTheDocument();
  });

  it("shows a clear error message when a fit fails", async () => {
    const calculate = vi.fn<backendInterface["calculate"]>(
      async (): Promise<CalcResult> => ({
        __kind__: "error",
        error: "The design matrix is singular.",
      }),
    );
    renderWithActor(<RegressionDemo />, makeActor(calculate));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("The design matrix is singular.");
    expect(screen.queryByTestId("demo.fits.table")).not.toBeInTheDocument();
  });

  it("re-runs the fits when the run button is pressed", async () => {
    const user = userEvent.setup();
    const { calculate, actor } = actorFitting();
    renderWithActor(<RegressionDemo />, actor);

    await screen.findByTestId("demo.fits.table");
    await waitFor(() =>
      expect(calculate).toHaveBeenCalledTimes(DEMO_LAMBDAS.length),
    );

    await user.click(screen.getByRole("button", { name: "Run fits" }));

    await waitFor(() =>
      expect(calculate).toHaveBeenCalledTimes(DEMO_LAMBDAS.length * 2),
    );
  });
});
