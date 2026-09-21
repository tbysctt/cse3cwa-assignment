import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PreferenceControls } from "@/components/settings/PreferenceControls";
import { DENSITIES, TEXT_SIZES, THEMES } from "@/lib/preferences";

vi.mock("@/app/actions/preferences", () => ({
  setTheme: vi.fn(async () => undefined),
  setTextSize: vi.fn(async () => undefined),
  setDensity: vi.fn(async () => undefined),
}));

import {
  setDensity,
  setTextSize,
  setTheme,
} from "@/app/actions/preferences";

describe("PreferenceControls", () => {
  it("renders three preference sections with selected hints", () => {
    render(
      <PreferenceControls
        theme="system"
        textSize="normal"
        density="comfortable"
      />,
    );

    expect(
      screen.getByRole("group", { name: "Colour theme" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Text size & readability" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Layout density" }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        THEMES.find((theme) => theme.value === "system")!.description,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        TEXT_SIZES.find((size) => size.value === "normal")!.description,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        DENSITIES.find((density) => density.value === "comfortable")!
          .description,
      ),
    ).toBeInTheDocument();
  });

  it("invokes preference actions when options are clicked", async () => {
    const user = userEvent.setup();
    render(
      <PreferenceControls
        theme="system"
        textSize="normal"
        density="comfortable"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Dark" }));
    expect(setTheme).toHaveBeenCalledWith("dark");

    await user.click(screen.getByRole("button", { name: "Large" }));
    expect(setTextSize).toHaveBeenCalledWith("large");

    await user.click(screen.getByRole("button", { name: "Compact" }));
    expect(setDensity).toHaveBeenCalledWith("compact");
  });
});
