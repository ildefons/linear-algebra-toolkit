import { Operation, type RegressionFit } from "@/backend";
import { Button } from "@/components/ui/button";
import { useCalculate } from "@/hooks/useQueries";
import {
  DEMO_DESIGN,
  DEMO_FEATURES,
  DEMO_LAMBDAS,
  DEMO_RESPONSE,
  formatNumber,
} from "@/lib/matrix";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Play,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type DemoFit = {
  lambda: number;
  fit: RegressionFit;
};

type DemoState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; fits: DemoFit[] }
  | { kind: "error"; message: string };

type RegressionDemoProps = {
  /**
   * When the demo is embedded in a larger page it starts collapsed and does not
   * run its fits until the reader opens it, so it never competes with the host
   * page's own backend calls or result text.
   */
  embedded?: boolean;
};

/** One observation row of the demo dataset, precomputed for stable keys. */
const DEMO_ROWS = DEMO_DESIGN.map((features, index) => ({
  id: `demo-row-${index}`,
  index,
  features,
  response: DEMO_RESPONSE[index] ?? 0,
}));

/** Feature column headers, precomputed for stable keys. */
const FEATURE_COLUMNS = DEMO_FEATURES.map((label, index) => ({
  id: `demo-feature-${index}`,
  label,
}));

/** Coefficient cells for one fit, precomputed for stable keys. */
function coefficientCells(fit: RegressionFit) {
  return fit.coefficients.map((value, index) => ({
    id: `demo-coef-${index}`,
    index,
    value,
  }));
}

export function RegressionDemo({ embedded = false }: RegressionDemoProps) {
  const calculate = useCalculate();
  const [state, setState] = useState<DemoState>({ kind: "idle" });
  const [expanded, setExpanded] = useState(!embedded);
  const runIdRef = useRef(0);
  const autoRanRef = useRef(false);

  const runFits = useCallback(async () => {
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    setState({ kind: "loading" });

    const fits: DemoFit[] = [];
    try {
      for (const lambda of DEMO_LAMBDAS) {
        const response = await calculate.mutateAsync({
          operation: Operation.lassoRegression,
          matrix: DEMO_DESIGN,
          vector: DEMO_RESPONSE,
          lambda,
        });
        if (runIdRef.current !== runId) return;
        if (response.__kind__ === "regression") {
          fits.push({ lambda, fit: response.regression });
        } else if (response.__kind__ === "error") {
          setState({ kind: "error", message: response.error });
          return;
        } else {
          setState({
            kind: "error",
            message: "The backend returned an unexpected result shape.",
          });
          return;
        }
      }
      if (runIdRef.current !== runId) return;
      setState({ kind: "ready", fits });
    } catch {
      if (runIdRef.current !== runId) return;
      setState({
        kind: "error",
        message:
          "The fits could not be completed. Check the connection and try again.",
      });
    }
  }, [calculate]);

  // Run the fits once, the first time the demo becomes visible.
  useEffect(() => {
    if (!expanded) return;
    if (autoRanRef.current) return;
    autoRanRef.current = true;
    void runFits();
  }, [expanded, runFits]);

  const isLoading = state.kind === "loading";
  const fits = state.kind === "ready" ? state.fits : [];

  return (
    <section
      id="demo"
      aria-label="Regularization demo"
      data-ocid="demo.section"
      className="scroll-mt-20"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="label-caps">Worked example</p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Regularization demo
          </h2>
        </div>
        {expanded && (
          <Button
            type="button"
            variant="outline"
            data-ocid="demo.run_button"
            onClick={() => void runFits()}
            disabled={isLoading}
            className="rounded-md"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Play className="size-4" aria-hidden="true" />
            )}
            <span>{isLoading ? "Fitting…" : "Run fits"}</span>
          </Button>
        )}
      </div>

      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        A fixed dataset of six observations, each an x with four features and a
        one-dimensional response y. The ordinary linear model (λ = 0) and lasso
        fits at increasing λ are run through the same lasso regression operation
        so the shrinkage toward zero is directly comparable.
      </p>

      {embedded && (
        <Button
          type="button"
          variant="outline"
          data-ocid="demo.toggle_button"
          aria-expanded={expanded}
          aria-controls="demo-content"
          onClick={() => setExpanded((current) => !current)}
          className="mt-4 rounded-md"
        >
          {expanded ? (
            <ChevronUp className="size-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="size-4" aria-hidden="true" />
          )}
          <span>
            {expanded ? "Hide worked example" : "Show worked example"}
          </span>
        </Button>
      )}

      {expanded && (
        <div
          id="demo-content"
          className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]"
        >
          <div
            data-ocid="demo.dataset.panel"
            className="rounded-lg border border-border bg-card p-5 shadow-subtle"
          >
            <h3 className="font-display text-base font-bold tracking-tight text-foreground">
              Dataset
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Design matrix X with the response y.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table
                data-ocid="demo.dataset.table"
                className="w-full border-collapse text-sm"
              >
                <thead>
                  <tr className="border-b border-border">
                    <th
                      scope="col"
                      className="px-2 py-2 text-left font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      #
                    </th>
                    {FEATURE_COLUMNS.map((column) => (
                      <th
                        key={column.id}
                        scope="col"
                        className="px-2 py-2 text-right font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {column.label}
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="px-2 py-2 text-right font-mono text-xs font-semibold uppercase tracking-wider text-accent"
                    >
                      y
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_ROWS.map((row) => (
                    <tr
                      key={row.id}
                      data-ocid={`demo.dataset.row.${row.index + 1}`}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="px-2 py-2 text-left font-mono text-xs text-muted-foreground">
                        {row.index + 1}
                      </td>
                      {row.features.map((value, featureIndex) => (
                        <td
                          key={`${row.id}-f${featureIndex}`}
                          className="px-2 py-2 text-right font-mono tabular-nums text-foreground"
                        >
                          {formatNumber(value)}
                        </td>
                      ))}
                      <td className="px-2 py-2 text-right font-mono font-medium tabular-nums text-accent">
                        {formatNumber(row.response)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div
            data-ocid="demo.fits.panel"
            className="rounded-lg border border-border bg-card p-5 shadow-subtle"
          >
            <h3 className="font-display text-base font-bold tracking-tight text-foreground">
              Fits
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Coefficients, intercept, convergence and residual sum of squares
              for each λ, rounded to three decimals.
            </p>

            {isLoading && (
              <div
                data-ocid="demo.loading_state"
                className="mt-4 flex items-center gap-3 rounded-md border border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground"
              >
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Running the ordinary and lasso fits…
              </div>
            )}

            {state.kind === "error" && (
              <div
                role="alert"
                data-ocid="demo.error_state"
                className="mt-4 flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                <span>Demo fits failed: {state.message}</span>
              </div>
            )}

            {state.kind === "idle" && (
              <p
                data-ocid="demo.empty_state"
                className="mt-4 text-sm text-muted-foreground"
              >
                Press Run fits to compute the ordinary and lasso fits.
              </p>
            )}

            {state.kind === "ready" && (
              <div className="mt-4 overflow-x-auto">
                <table
                  data-ocid="demo.fits.table"
                  className="w-full border-collapse text-sm"
                >
                  <thead>
                    <tr className="border-b border-border">
                      <th
                        scope="col"
                        className="px-2 py-2 text-left font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        λ
                      </th>
                      <th
                        scope="col"
                        className="px-2 py-2 text-left font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        Model
                      </th>
                      {FEATURE_COLUMNS.map((column) => (
                        <th
                          key={column.id}
                          scope="col"
                          className="px-2 py-2 text-right font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          β{column.label.slice(1)}
                        </th>
                      ))}
                      <th
                        scope="col"
                        className="px-2 py-2 text-right font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        β₀
                      </th>
                      <th
                        scope="col"
                        className="px-2 py-2 text-right font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        RSS
                      </th>
                      <th
                        scope="col"
                        className="px-2 py-2 text-right font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        Conv.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fits.map((entry) => (
                      <tr
                        key={`demo-fit-${entry.lambda}`}
                        data-ocid={`demo.fits.row.${entry.lambda}`}
                        className="border-b border-border/60 last:border-0"
                      >
                        <td className="px-2 py-2 text-left font-mono tabular-nums text-foreground">
                          {formatNumber(entry.lambda)}
                        </td>
                        <td className="px-2 py-2 text-left text-xs text-muted-foreground">
                          {entry.lambda === 0 ? "Ordinary" : "Lasso"}
                        </td>
                        {coefficientCells(entry.fit).map((cell) => (
                          <td
                            key={cell.id}
                            className="px-2 py-2 text-right font-mono tabular-nums text-foreground"
                          >
                            {formatNumber(cell.value)}
                          </td>
                        ))}
                        <td className="px-2 py-2 text-right font-mono tabular-nums text-foreground">
                          {formatNumber(entry.fit.intercept)}
                        </td>
                        <td className="px-2 py-2 text-right font-mono tabular-nums text-foreground">
                          {formatNumber(entry.fit.residualSumOfSquares)}
                        </td>
                        <td
                          className={`px-2 py-2 text-right font-mono tabular-nums ${
                            entry.fit.converged
                              ? "text-success"
                              : "text-warning"
                          }`}
                        >
                          {entry.fit.converged ? "Yes" : "No"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4 sm:grid-cols-4">
                  {fits.map((entry) => (
                    <div key={`demo-meta-${entry.lambda}`}>
                      <dt className="label-caps">
                        λ = {formatNumber(entry.lambda)}
                      </dt>
                      <dd className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
                        {entry.fit.iterations.toString()} iterations
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
