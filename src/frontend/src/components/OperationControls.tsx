import { Button } from "@/components/ui/button";
import { OPERATIONS, type OperationMeta } from "@/lib/matrix";
import { ArrowRight } from "lucide-react";

type OperationControlsProps = {
  selected: OperationMeta;
  onSelect: (op: OperationMeta) => void;
  onCalculate: () => void;
  isPending: boolean;
  disabled: boolean;
};

export function OperationControls({
  selected,
  onSelect,
  onCalculate,
  isPending,
  disabled,
}: OperationControlsProps) {
  return (
    <section
      aria-label="Operations"
      data-ocid="operations.panel"
      className="rounded-lg border border-border bg-card p-6 shadow-subtle"
    >
      <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
        Operations
      </h2>
      <fieldset className="mt-4 flex flex-wrap gap-2">
        <legend className="sr-only">Choose an operation</legend>
        {OPERATIONS.map((op) => {
          const active = op.id === selected.id;
          return (
            <button
              key={op.id}
              type="button"
              aria-pressed={active}
              data-ocid={`operations.${op.id}.tab`}
              onClick={() => onSelect(op)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                active
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-muted text-muted-foreground hover:border-accent/50 hover:text-foreground"
              }`}
            >
              {op.label}
            </button>
          );
        })}
      </fieldset>

      <Button
        type="button"
        data-ocid="operations.calculate_button"
        onClick={onCalculate}
        disabled={disabled || isPending}
        className="mt-5 w-full justify-between rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <span>{isPending ? "Calculating…" : "Calculate"}</span>
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
    </section>
  );
}
