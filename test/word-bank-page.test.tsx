import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WordBankPageClient } from "@/components/word-bank/WordBankPageClient";
import { TEST_BUILDER_PROPS } from "./fixtures";

vi.mock("@/app/actions/words", () => ({
  createWordAction: vi.fn(),
  updateWordAction: vi.fn(),
  deleteWordAction: vi.fn(),
  listWordsAction: vi.fn(),
}));

describe("Word bank page", () => {
  it("renders the managed word bank list", () => {
    render(
      <WordBankPageClient
        initialWords={TEST_BUILDER_PROPS.words}
        inventory={TEST_BUILDER_PROPS.inventory}
      />,
    );

    expect(screen.getByText("Word bank")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Word bank" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add word" })).toBeInTheDocument();
  });
});
