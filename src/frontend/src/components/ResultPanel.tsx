import type { RegressionFit } from "@/backend";
import { Button } from "@/components/ui/button";
import { type Matrix, formatMatrix, formatNumber } from "@/lib/matrix";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export type ResultState =
  | { kind: "idle" }
  | { kind: "matrix"; matrix: Matrix }
  | { kind: "scalar"; scalar: number }
  | { kind: "regression"; fit: RegressionFit }
  | { kind: "error"; message: string };

/** Human-readable, consistently rounded rendering of a regression fit. */
function formatRegression(fit: RegressionFit): string {
  const coefficients = fit.coefficients.map(formatNumber).join(", ");
  return [
    `coefficients = [${coefficients}]`,
    `intercept = ${formatNumber(fit.intercept)}`,
    `iterations = ${fit.iterations.toString()}`,
    `converged = ${fit.converged ? "yes" : "no"}`,
    `residual sum of squares = ${formatNumber(fit.residualSumOfSquares)}`,
  ].join("\n");
}

type ResultPanelProps = {
  state: ResultState;
  operationLabel: string;
  inputSummary: string;
};

export function ResultPanel({
  state,
  operationLabel,
  inputSummary,
}: ResultPanelProps) {
  const [copied, setCopied] = useState(false);

  const copyText =
    state.kind === "matrix"
      ? formatMatrix(state.matrix)
      : state.kind === "scalar"
        ? formatNumber(state.scalar)
        : state.kind === "regression"
          ? formatRegression(state.fit)
          : "";

  const resultCells =
    state.kind === "matrix"
      ? state.matrix.flatMap((row, r) =>
          row.map((value, c) => ({ id: `cell-${r}-${c}`, value })),
        )
      : [];

  const coefficientCells =
    state.kind === "regression"
      ? state.fit.coefficients.map((value, index) => ({
          id: `coef-${index}`,
          index,
          value,
        }))
      : [];

  async function handleCopy() {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section
      aria-label="Result"
      data-ocid="result.panel"
      className="rounded-lg border border-border bg-card p-6 shadow-subtle"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
            Result
          </h2>
          <p data-ocid="result.operation_label" className="mt-1 label-caps">
            Result — {operationLabel}
          </p>
        </div>
        {state.kind !== "idle" && state.kind !== "error" && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Copy result to clipboard"
            data-ocid="result.copy_button"
            onClick={handleCopy}
            className="shrink-0 rounded-md"
          >
            {copied ? (
              <Check className="size-4 text-success" aria-hidden="true" />
            ) : (
              <Copy className="size-4" aria-hidden="true" />
            )}
          </Button>
        )}
      </div>

      <div className="mt-4">
        {state.kind === "idle" && (
          <p
            data-ocid="result.empty_state"
            className="text-sm text-muted-foreground"
          >
            Choose an operation and press Calculate to see the result here.
          </p>
        )}

        {state.kind === "error" && (
          <div
            role="alert"
            data-ocid="result.error_state"
            className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
          >
            {state.message}
          </div>
        )}

        {state.kind === "scalar" && (
          <output
            data-ocid="result.scalar_value"
            className="block font-display text-4xl font-bold tabular-nums tracking-tight text-foreground"
          >
            {formatNumber(state.scalar)}
          </output>
        )}

        {state.kind === "matrix" && (
          <div className="overflow-x-auto">
            <div className="matrix-bracket inline-block">
              <div
                data-ocid="result.matrix_value"
                className="grid gap-x-4 gap-y-1.5"
                style={{
                  gridTemplateColumns: `repeat(${state.matrix[0]?.length ?? 1}, minmax(3.5rem, auto))`,
                }}
              >
                {resultCells.map((cell) => (
                  <span
                    key={cell.id}
                    className="text-right font-mono text-sm tabular-nums text-foreground"
                  >
                    {formatNumber(cell.value)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {state.kind === "regression" && (
          <div data-ocid="result.regression_value" className="space-y-4">
            <div>
              <span className="label-caps">Coefficients</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {coefficientCells.map((cell) => (
                  <span
                    key={cell.id}
                    className="rounded-md border border-border bg-muted/50 px-2.5 py-1 font-mono text-sm tabular-nums text-foreground"
                  >
                    <span className="text-muted-foreground">
                      β{cell.index + 1} ={" "}
                    </span>
                    {formatNumber(cell.value)}
                  </span>
                ))}
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
              <div>
                <dt className="label-caps">Intercept</dt>
                <dd
                  data-ocid="result.regression_intercept"
                  className="mt-1 font-mono text-sm tabular-nums text-foreground"
                >
                  {formatNumber(state.fit.intercept)}
                </dd>
              </div>
              <div>
                <dt className="label-caps">Iterations</dt>
                <dd
                  data-ocid="result.regression_iterations"
                  className="mt-1 font-mono text-sm tabular-nums text-foreground"
                >
                  {state.fit.iterations.toString()}
                </dd>
              </div>
              <div>
                <dt className="label-caps">Converged</dt>
                <dd
                  data-ocid="result.regression_converged"
                  className={`mt-1 font-mono text-sm tabular-nums ${
                    state.fit.converged ? "text-success" : "text-warning"
                  }`}
                >
                  {state.fit.converged ? "Yes" : "No"}
                </dd>
              </div>
              <div>
                <dt className="label-caps">Residual SS</dt>
                <dd
                  data-ocid="result.regression_rss"
                  className="mt-1 font-mono text-sm tabular-nums text-foreground"
                >
                  {formatNumber(state.fit.residualSumOfSquares)}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {state.kind !== "idle" && (
        <p
          data-ocid="result.input_summary"
          className="mt-4 border-t border-border pt-3 font-mono text-xs text-muted-foreground"
        >
          {inputSummary}
        </p>
      )}
    </section>
  );
}
