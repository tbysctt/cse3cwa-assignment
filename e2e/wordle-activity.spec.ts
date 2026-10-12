import { expect, test } from "@playwright/test";

test.describe("Wordle generated activity use case", () => {
  test("views Activity Preview and downloads generated HTML", async ({
    page,
  }) => {
    await page.goto("/wordle");
    await expect(
      page.getByRole("heading", { name: "Phoneme Wordle", level: 1 }),
    ).toBeVisible();

    const preview = page.getByLabel("Activity preview");
    await expect(preview).toBeVisible();
    await expect(
      preview.getByRole("group", { name: "Phoneme keyboard" }),
    ).toBeVisible();

    const firstKey = preview
      .getByRole("group", { name: "Phoneme keyboard" })
      .getByRole("button")
      .first();
    await expect(firstKey).toBeEnabled();
    await firstKey.click();

    await expect(
      preview.getByRole("group", { name: "Phoneme keyboard" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Generate and download HTML" }),
    ).toBeEnabled();

    const downloadPromise = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Generate and download HTML" })
      .click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("phoneme-wordle.html");
  });
});
