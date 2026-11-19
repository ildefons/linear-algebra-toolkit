import { Operation } from "@/backend";
import { MatrixInput } from "@/components/MatrixInput";
import { OperationControls } from "@/components/OperationControls";
import { ReferenceSection } from "@/components/ReferenceSection";
import { RegressionDemo } from "@/components/RegressionDemo";
import { ResultPanel, type ResultState } from "@/components/ResultPanel";
import { useCalculate } from "@/hooks/useQueries";
import {
  type Matrix,
  type OperationMeta,
  SAMPLE_A,
  SAMPLE_B,
  SAMPLE_DESIGN,
  SAMPLE_RESPONSE,
  SAMPLE_VECTOR,
  cloneMatrix,
  createMatrix,
  formatMatrix,
  formatNumber,
  operationMeta,
  parseCell,
  resizeMatrix,
} from "@/lib/matrix";
import { useEffect, useState } from "react";

type CellErrors = Record<string, string>;

function validate(matrix: Matrix): CellErrors {
  const errors: CellErrors = {};
  matrix.forEach((row, r) =>
    row.forEach((value, c) => {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        errors[`${r}-${c}`] = "Enter a number";
      }
    }),
  );
  return errors;
}

export default function Calculator() {
  const [matrixA, setMatrixA] = useState<Matrix>(() => cloneMatrix(SAMPLE_A));
  const [matrixB, setMatrixB] = useState<Matrix>(() => cloneMatrix(SAMPLE_B));
  const [vectorB, setVectorB] = useState<number[]>(() => [...SAMPLE_VECTOR]);
  const [responseVector, setResponseVector] = useState<number[]>(() => [
    ...SAMPLE_RESPONSE,
  ]);
  const [scalar, setScalar] = useState("2");
  const [lambda, setLambda] = useState("0.1");
  const [selected, setSelected] = useState<OperationMeta>(() =>
    operationMeta(Operation.determinant),
  );
  const [errorsA, setErrorsA] = useState<CellErrors>({});
  const [errorsB, setErrorsB] = useState<CellErrors>({});
  const [result, setResult] = useState<ResultState>({ kind: "idle" });
  const [inputSummary, setInputSummary] = useState("");

  const calculate = useCalculate();

  const needsB = selected.kind === "binary";
  const needsScalar = selected.kind === "scalar";
  const needsVector = selected.kind === "solve";
  const needsRegression = selected.kind === "regression";

  const vectorEntries = vectorB.map((value, i) => ({
    id: `b-entry-${i}`,
    index: i,
    value,
  }));

  const responseEntries = responseVector.map((value, i) => ({
    id: `y-entry-${i}`,
    index: i,
    value,
  }));

  // Keep the vector length in step with matrix A's row count for Ax = b.
  useEffect(() => {
    if (!needsVector) return;
    setVectorB((current) => {
      const rows = matrixA.length;
      if (current.length === rows) return current;
      return Array.from({ length: rows }, (_, i) => current[i] ?? 0);
    });
  }, [needsVector, matrixA.length]);

  // Keep the response vector length in step with the design matrix's row count.
  useEffect(() => {
    if (!needsRegression) return;
    setResponseVector((current) => {
      const rows = matrixA.length;
      if (current.length === rows) return current;
      return Array.from({ length: rows }, (_, i) => current[i] ?? 0);
    });
  }, [needsRegression, matrixA.length]);

  function updateCell(
    setter: React.Dispatch<React.SetStateAction<Matrix>>,
    setErrors: React.Dispatch<React.SetStateAction<CellErrors>>,
    r: number,
    c: number,
    raw: string,
  ) {
    const parsed = parseCell(raw);
    setter((current) =>
      current.map((row, ri) =>
        ri === r
          ? row.map((v, ci) => (ci === c ? (parsed ?? Number.NaN) : v))
          : row,
      ),
    );
    setErrors((current) => {
      const next = { ...current };
      if (parsed === null) {
        next[`${r}-${c}`] = "Enter a number";
      } else {
        delete next[`${r}-${c}`];
      }
      return next;
    });
  }

  function handleCalculate() {
    const nextErrorsA = validate(matrixA);
    const nextErrorsB = needsB ? validate(matrixB) : {};
    setErrorsA(nextErrorsA);
    setErrorsB(nextErrorsB);

    if (
      Object.keys(nextErrorsA).length > 0 ||
      Object.keys(nextErrorsB).length > 0
    ) {
      setResult({
        kind: "error",
        message: "Fix the highlighted cells before calculating.",
      });
      return;
    }

    const scalarValue = needsScalar ? parseCell(scalar) : null;
    if (needsScalar && scalarValue === null) {
      setResult({ kind: "error", message: "Enter a valid scalar value." });
      return;
    }

    const lambdaValue = needsRegression ? parseCell(lambda) : null;
    if (needsRegression && lambdaValue === null) {
      setResult({
        kind: "error",
        message: "Enter a valid regularization strength (λ ≥ 0).",
      });
      return;
    }

    const summaryParts = [
      needsRegression
        ? `X = ${formatMatrix(matrixA)}`
        : `A = ${formatMatrix(matrixA)}`,
    ];
    if (needsB) summaryParts.push(`B = ${formatMatrix(matrixB)}`);
    if (needsScalar && scalarValue !== null)
      summaryParts.push(`k = ${formatNumber(scalarValue)}`);
    if (needsVector)
      summaryParts.push(`b = [${vectorB.map(formatNumber).join(", ")}]`);
    if (needsRegression) {
      summaryParts.push(`y = [${responseVector.map(formatNumber).join(", ")}]`);
      if (lambdaValue !== null)
        summaryParts.push(`λ = ${formatNumber(lambdaValue)}`);
    }
    setInputSummary(summaryParts.join("   ·   "));

    calculate.mutate(
      {
        operation: selected.id,
        matrix: matrixA,
        matrixB: needsB ? matrixB : undefined,
        scalar: needsScalar && scalarValue !== null ? scalarValue : undefined,
        vector: needsVector
          ? vectorB
          : needsRegression
            ? responseVector
            : undefined,
        lambda:
          needsRegression && lambdaValue !== null ? lambdaValue : undefined,
      },
      {
        onSuccess: (response) => {
          if (response.__kind__ === "matrix") {
            setResult({ kind: "matrix", matrix: response.matrix });
          } else if (response.__kind__ === "scalar") {
            setResult({ kind: "scalar", scalar: response.scalar });
          } else if (response.__kind__ === "regression") {
            setResult({ kind: "regression", fit: response.regression });
          } else {
            setResult({ kind: "error", message: response.error });
          }
        },
        onError: () => {
          setResult({
            kind: "error",
            message:
              "The calculation could not be completed. Please try again.",
          });
        },
      },
    );
  }

  return (
    <div id="workbench" className="scroll-mt-20 space-y-10">
      <header className="max-w-2xl animate-fade-in-up">
        <p className="label-caps">Linear algebra workbench</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Matrix calculator
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Enter a matrix, choose an operation, and read the result —
          determinants, inverses, ranks, products, linear systems, and lasso
          regression, all rounded consistently.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="animate-fade-in-up">
            <MatrixInput
              label={needsRegression ? "Design matrix X" : "Matrix A"}
              matrix={matrixA}
              errors={errorsA}
              ocidPrefix="matrix_a"
              onChange={(r, c, raw) =>
                updateCell(setMatrixA, setErrorsA, r, c, raw)
              }
              onResize={(rows, cols) =>
                setMatrixA((m) => resizeMatrix(m, rows, cols))
              }
              onLoadSample={() => {
                setMatrixA(
                  cloneMatrix(needsRegression ? SAMPLE_DESIGN : SAMPLE_A),
                );
                setErrorsA({});
              }}
              onClear={() => {
                setMatrixA((m) => createMatrix(m.length, m[0]?.length ?? 1));
                setErrorsA({});
              }}
            />
          </div>

          {needsB && (
            <div className="animate-fade-in-up">
              <MatrixInput
                label="Matrix B"
                matrix={matrixB}
                errors={errorsB}
                ocidPrefix="matrix_b"
                onChange={(r, c, raw) =>
                  updateCell(setMatrixB, setErrorsB, r, c, raw)
                }
                onResize={(rows, cols) =>
                  setMatrixB((m) => resizeMatrix(m, rows, cols))
                }
                onLoadSample={() => {
                  setMatrixB(cloneMatrix(SAMPLE_B));
                  setErrorsB({});
                }}
                onClear={() => {
                  setMatrixB((m) => createMatrix(m.length, m[0]?.length ?? 1));
                  setErrorsB({});
                }}
              />
            </div>
          )}

          {needsScalar && (
            <section
              aria-label="Scalar"
              data-ocid="scalar.panel"
              className="animate-fade-in-up rounded-lg border border-border bg-card p-6 shadow-subtle"
            >
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
                Scalar
              </h2>
              <label
                htmlFor="scalar-input"
                className="mt-3 block text-sm font-medium text-muted-foreground"
              >
                Multiply every entry of A by
              </label>
              <input
                id="scalar-input"
                inputMode="decimal"
                data-ocid="scalar.input"
                value={scalar}
                onChange={(event) => setScalar(event.target.value)}
                className="mt-2 h-9 w-32 rounded-md border border-input bg-background px-2 text-center font-mono text-sm tabular-nums text-foreground outline-none transition-smooth focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
              />
            </section>
          )}

          {needsVector && (
            <section
              aria-label="Vector b"
              data-ocid="vector.panel"
              className="animate-fade-in-up rounded-lg border border-border bg-card p-6 shadow-subtle"
            >
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
                Vector b
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                One entry per row of A — the right-hand side of Ax = b.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {vectorEntries.map((entry) => (
                  <input
                    key={entry.id}
                    inputMode="decimal"
                    aria-label={`Vector b entry ${entry.index + 1}`}
                    data-ocid={`vector.input.${entry.index + 1}`}
                    value={String(entry.value)}
                    onChange={(event) => {
                      const parsed = parseCell(event.target.value);
                      setVectorB((current) =>
                        current.map((v, vi) =>
                          vi === entry.index ? (parsed ?? Number.NaN) : v,
                        ),
                      );
                    }}
                    className="h-9 w-20 rounded-md border border-input bg-background px-2 text-center font-mono text-sm tabular-nums text-foreground outline-none transition-smooth focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
                  />
                ))}
              </div>
            </section>
          )}

          {needsRegression && (
            <section
              aria-label="Regression inputs"
              data-ocid="regression.panel"
              className="animate-fade-in-up rounded-lg border border-border bg-card p-6 shadow-subtle"
            >
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
                Regression inputs
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The design matrix X above has one row per observation and one
                column per feature. Provide the response y and the
                regularization strength λ.
              </p>

              <div className="mt-4">
                <span className="text-sm font-medium text-muted-foreground">
                  Response y — one value per observation
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {responseEntries.map((entry) => (
                    <input
                      key={entry.id}
                      inputMode="decimal"
                      aria-label={`Response y entry ${entry.index + 1}`}
                      data-ocid={`regression.response_input.${entry.index + 1}`}
                      value={String(entry.value)}
                      onChange={(event) => {
                        const parsed = parseCell(event.target.value);
                        setResponseVector((current) =>
                          current.map((v, vi) =>
                            vi === entry.index ? (parsed ?? Number.NaN) : v,
                          ),
                        );
                      }}
                      className="h-9 w-20 rounded-md border border-input bg-background px-2 text-center font-mono text-sm tabular-nums text-foreground outline-none transition-smooth focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
                    />
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="lambda-input"
                  className="block text-sm font-medium text-muted-foreground"
                >
                  Regularization strength λ (≥ 0)
                </label>
                <input
                  id="lambda-input"
                  inputMode="decimal"
                  data-ocid="regression.lambda_input"
                  value={lambda}
                  onChange={(event) => setLambda(event.target.value)}
                  className="mt-2 h-9 w-32 rounded-md border border-input bg-background px-2 text-center font-mono text-sm tabular-nums text-foreground outline-none transition-smooth focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Larger λ shrinks coefficients toward zero; λ = 0 reduces to
                  ordinary least squares.
                </p>
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <div className="animate-fade-in-up">
            <OperationControls
              selected={selected}
              onSelect={(op) => {
                setSelected(op);
                setResult({ kind: "idle" });
              }}
              onCalculate={handleCalculate}
              isPending={calculate.isPending}
              disabled={false}
            />
          </div>
          <div className="animate-fade-in-up">
            <ResultPanel
              state={result}
              operationLabel={selected.label}
              inputSummary={inputSummary}
            />
          </div>
        </div>
      </div>

      <RegressionDemo embedded />

      <ReferenceSection />
    </div>
  );
}
