import { OPERATIONS } from "@/lib/matrix";

export function ReferenceSection() {
  return (
    <section
      id="reference"
      aria-label="Operation reference"
      data-ocid="reference.section"
      className="scroll-mt-20"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Reference
        </h2>
        <span className="font-mono text-xs text-muted-foreground">
          {OPERATIONS.length} operations
        </span>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Every supported operation, its definition, and a worked example. All
        results are rounded to three decimal places.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {OPERATIONS.map((op) => (
          <article
            key={op.id}
            data-ocid={`reference.${op.id}.card`}
            className="rounded-lg border border-border bg-card p-5 shadow-subtle"
          >
            <h3 className="font-display text-base font-bold tracking-tight text-foreground">
              {op.label}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {op.definition}
            </p>
            <div className="mt-3 rounded-md border border-border bg-muted/50 px-3 py-2">
              <span className="label-caps">Example</span>
              <p className="mt-1 break-words font-mono text-xs leading-relaxed text-foreground">
                {op.example}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
