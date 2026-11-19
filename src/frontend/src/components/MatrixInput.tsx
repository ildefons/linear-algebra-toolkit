import { Button } from "@/components/ui/button";
import { MAX_DIM, MIN_DIM, type Matrix } from "@/lib/matrix";
import { Minus, Plus } from "lucide-react";

type MatrixInputProps = {
  label: string;
  matrix: Matrix;
  errors: Record<string, string>;
  onChange: (row: number, col: number, raw: string) => void;
  onResize: (rows: number, cols: number) => void;
  onLoadSample: () => void;
  onClear: () => void;
  ocidPrefix: string;
};

function Stepper({
  label,
  value,
  onChange,
  ocid,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  ocid: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center rounded-md border border-input bg-background">
        <button
          type="button"
          aria-label={`Decrease ${label.toLowerCase()}`}
          data-ocid={`${ocid}.decrement_button`}
          disabled={value <= MIN_DIM}
          onClick={() => onChange(value - 1)}
          className="flex size-7 items-center justify-center rounded-l-md text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          <Minus className="size-3.5" aria-hidden="true" />
        </button>
        <span className="w-7 text-center font-mono text-sm font-medium tabular-nums text-foreground">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label.toLowerCase()}`}
          data-ocid={`${ocid}.increment_button`}
          disabled={value >= MAX_DIM}
          onClick={() => onChange(value + 1)}
          className="flex size-7 items-center justify-center rounded-r-md text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          <Plus className="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function MatrixInput({
  label,
  matrix,
  errors,
  onChange,
  onResize,
  onLoadSample,
  onClear,
  ocidPrefix,
}: MatrixInputProps) {
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;

  return (
    <section
      aria-label={label}
      data-ocid={`${ocidPrefix}.panel`}
      className="rounded-lg border border-border bg-card p-6 shadow-subtle"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
          {label}
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <Stepper
            label="Rows"
            value={rows}
            ocid={`${ocidPrefix}.rows`}
            onChange={(next) => onResize(next, cols)}
          />
          <Stepper
            label="Cols"
            value={cols}
            ocid={`${ocidPrefix}.cols`}
            onChange={(next) => onResize(rows, next)}
          />
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="matrix-bracket inline-block">
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(4.5rem, 1fr))`,
            }}
          >
            {matrix.map((row, r) =>
              row.map((value, c) => {
                const key = `${r}-${c}`;
                const error = errors[key];
                return (
                  <div key={key} className="flex flex-col gap-1">
                    <input
                      inputMode="decimal"
                      aria-label={`${label} row ${r + 1} column ${c + 1}`}
                      aria-invalid={error ? true : undefined}
                      data-ocid={`${ocidPrefix}.cell.${r + 1}.${c + 1}`}
                      value={String(value)}
                      onChange={(event) => onChange(r, c, event.target.value)}
                      className={`h-9 w-full rounded-md border bg-background px-2 text-center font-mono text-sm tabular-nums text-foreground outline-none transition-smooth focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40 ${
                        error ? "border-destructive" : "border-input"
                      }`}
                    />
                    {error && (
                      <span
                        role="alert"
                        data-ocid={`${ocidPrefix}.cell_error.${r + 1}.${c + 1}`}
                        className="text-[0.65rem] font-medium text-destructive"
                      >
                        {error}
                      </span>
                    )}
                  </div>
                );
              }),
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-ocid={`${ocidPrefix}.sample_button`}
          onClick={onLoadSample}
          className="rounded-md"
        >
          Load sample
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-ocid={`${ocidPrefix}.clear_button`}
          onClick={onClear}
          className="rounded-md"
        >
          Clear
        </Button>
      </div>
    </section>
  );
}
