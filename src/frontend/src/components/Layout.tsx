import { Sigma } from "lucide-react";
import type { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  const year = new Date().getFullYear();
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sigma className="size-5" aria-hidden="true" />
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl font-bold tracking-tight text-foreground">
                Matrix
              </span>
              <span className="hidden rounded-full bg-muted px-2 py-0.5 font-mono text-[0.65rem] font-medium text-muted-foreground sm:inline">
                v1.0.0
              </span>
            </div>
          </div>
          <nav aria-label="Sections" className="flex items-center gap-1">
            <a
              href="#workbench"
              data-ocid="nav.workbench.link"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
            >
              Workbench
            </a>
            <a
              href="#reference"
              data-ocid="nav.reference.link"
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground"
            >
              Reference
            </a>
          </nav>
        </div>
      </header>

      <main className="relative flex-1">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-blueprint-grid animate-grid-pulse"
        />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </div>
      </main>

      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p className="font-mono text-xs">
            Linear algebra workbench · determinant · inverse · rank · solve
          </p>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            data-ocid="footer.attribution.link"
            className="transition-smooth hover:text-foreground"
          >
            © {year}. Built with love using caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
