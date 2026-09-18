import { describe, expect, it } from "vitest";
import {
  canDeleteSelected,
  canSaveLoaded,
  generateHintForMode,
  isDirtyDraft,
  resolveGenerateMode,
} from "@/lib/saved-activities";

describe("saved-activities helpers", () => {
  it("detects dirty drafts only when a saved activity has a clean baseline", () => {
    expect(isDirtyDraft(null, null, "a")).toBe(false);
    expect(isDirtyDraft("id", "sig", "sig")).toBe(false);
    expect(isDirtyDraft("id", "sig", "other")).toBe(true);
    expect(isDirtyDraft("id", null, "sig")).toBe(false);
  });

  it("prefers database generate when clean, otherwise draft", () => {
    expect(
      resolveGenerateMode({
        savedId: "id",
        isDirty: false,
        canDraftGenerate: true,
      }),
    ).toBe("database");

    expect(
      resolveGenerateMode({
        savedId: "id",
        isDirty: true,
        canDraftGenerate: true,
      }),
    ).toBe("draft");

    expect(
      resolveGenerateMode({
        savedId: null,
        isDirty: false,
        canDraftGenerate: true,
      }),
    ).toBe("draft");

    expect(
      resolveGenerateMode({
        savedId: "id",
        isDirty: true,
        canDraftGenerate: false,
      }),
    ).toBe("none");
  });

  it("explains generate modes clearly", () => {
    expect(
      generateHintForMode("database", {
        savedId: "id",
        isDirty: false,
        draftHint: "draft",
      }),
    ).toMatch(/database/i);

    expect(
      generateHintForMode("draft", {
        savedId: "id",
        isDirty: true,
        draftHint: "draft hint",
      }),
    ).toMatch(/unsaved/i);
  });

  it("gates save and delete correctly", () => {
    expect(canSaveLoaded({ savedId: null, canSaveDraft: true })).toBe(false);
    expect(canSaveLoaded({ savedId: "id", canSaveDraft: true })).toBe(true);
    expect(canDeleteSelected("")).toBe(false);
    expect(canDeleteSelected("id")).toBe(true);
  });
});
