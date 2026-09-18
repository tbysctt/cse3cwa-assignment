import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SavedActivitiesPanel } from "@/components/shared/SavedActivitiesPanel";

const baseProps = {
  activityName: "Demo",
  onActivityNameChange: vi.fn(),
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
  onSelectedIdChange: vi.fn(),
  savedId: "a1" as string | null,
  isDirty: false,
  canSave: true,
  busy: false,
  message: null as string | null,
  error: null as string | null,
  onLoad: vi.fn(),
  onSave: vi.fn(),
  onSaveAsNew: vi.fn(),
  onDelete: vi.fn(),
};

describe("SavedActivitiesPanel", () => {
  it("enables Load and Delete when a summary is selected", () => {
    render(<SavedActivitiesPanel {...baseProps} savedId={null} />);
    expect(screen.getByRole("button", { name: "Load" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save as new" })).toBeEnabled();
  });

  it("enables Save only when a loaded activity can be saved", () => {
    render(<SavedActivitiesPanel {...baseProps} />);
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("disables actions while busy", () => {
    render(<SavedActivitiesPanel {...baseProps} busy />);
    expect(screen.getByRole("button", { name: "Load" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save as new" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
  });

  it("shows status message and error", () => {
    render(
      <SavedActivitiesPanel
        {...baseProps}
        message="Saved."
        error="Something failed"
      />,
    );
    expect(screen.getByText("Saved.")).toBeInTheDocument();
    expect(screen.getByText("Something failed")).toBeInTheDocument();
  });
});
