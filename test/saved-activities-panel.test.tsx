import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SavedActivitiesPanel } from "@/components/shared/SavedActivitiesPanel";

const baseProps = {
  summaries: [
    {
      id: "a1",
      name: "Thin",
      activityType: "wordle" as const,
      difficulty: "medium" as const,
      showHints: true,
      maxAttempts: 6,
      seed: null,
      wordCount: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  selectedId: "a1",
  savedId: "a1" as string | null,
  isDirty: false,
  busy: false,
  message: null as string | null,
  error: null as string | null,
  onCreateNew: vi.fn(),
  onSelectActivity: vi.fn(),
  onRename: vi.fn(),
  onDelete: vi.fn(),
};

describe("SavedActivitiesPanel", () => {
  it("lists saved activities and wires select, rename, and delete", async () => {
    const user = userEvent.setup();
    render(<SavedActivitiesPanel {...baseProps} />);

    expect(
      screen.getByRole("list", { name: "Saved configurations" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Thin")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Thin.*medium/i }),
    );
    expect(baseProps.onSelectActivity).toHaveBeenCalledWith("a1");

    await user.click(screen.getByRole("button", { name: "Rename Thin" }));
    expect(baseProps.onRename).toHaveBeenCalledWith("a1");

    await user.click(screen.getByRole("button", { name: "Delete Thin" }));
    expect(baseProps.onDelete).toHaveBeenCalledWith("a1");
  });

  it("offers Create new", async () => {
    const user = userEvent.setup();
    render(<SavedActivitiesPanel {...baseProps} savedId={null} selectedId="" />);
    await user.click(screen.getByRole("button", { name: "Create new" }));
    expect(baseProps.onCreateNew).toHaveBeenCalled();
  });

  it("disables actions while busy", () => {
    render(<SavedActivitiesPanel {...baseProps} busy />);
    expect(screen.getByRole("button", { name: "Create new" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Rename Thin" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete Thin" })).toBeDisabled();
  });

  it("shows empty state, status message, and error", () => {
    render(
      <SavedActivitiesPanel
        {...baseProps}
        summaries={[]}
        selectedId=""
        savedId={null}
        message="Saved."
        error="Something failed"
      />,
    );
    expect(screen.getByText(/No saved activities yet/i)).toBeInTheDocument();
    expect(screen.getByText("Saved.")).toBeInTheDocument();
    expect(screen.getByText("Something failed")).toBeInTheDocument();
  });
});
