import App from "@/App";
import type { backendInterface } from "@/backend";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithActor } from "./test-utils";

type CalculateMock = ReturnType<typeof vi.fn<backendInterface["calculate"]>>;

function makeActor(calculate: CalculateMock) {
  return { calculate } satisfies Pick<backendInterface, "calculate">;
}

/** A fake actor that never resolves, so the shell renders without a result. */
function idleActor() {
  const calculate = vi.fn<backendInterface["calculate"]>(
    async () => ({ __kind__: "scalar", scalar: 0 }) as never,
  );
  return makeActor(calculate);
}

describe("App", () => {
  it("renders the default route without a blank screen", () => {
    renderWithActor(<App />, idleActor());

    expect(
      screen.getByRole("heading", { name: "Matrix calculator" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Matrix A")).toBeInTheDocument();
    expect(screen.getByLabelText("Operations")).toBeInTheDocument();
    expect(screen.getByLabelText("Result")).toBeInTheDocument();
    expect(screen.getByLabelText("Operation reference")).toBeInTheDocument();
  });

  it("shows the app shell header, section navigation and footer", () => {
    renderWithActor(<App />, idleActor());

    const nav = screen.getByRole("navigation", { name: "Sections" });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Workbench" })).toHaveAttribute(
      "href",
      "#workbench",
    );
    expect(screen.getByRole("link", { name: "Reference" })).toHaveAttribute(
      "href",
      "#reference",
    );
    expect(screen.getByText("Matrix")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Built with love using caffeine\.ai/ }),
    ).toBeInTheDocument();
  });

  it("starts on the idle result state before any calculation", () => {
    renderWithActor(<App />, idleActor());

    expect(
      screen.getByText(
        "Choose an operation and press Calculate to see the result here.",
      ),
    ).toBeInTheDocument();
  });
});
