import { expect, test } from "@playwright/test";

test.describe("word bank builder CRUD", () => {
  test("creates, updates, and deletes a word list entry", async ({ page }) => {
    const suffix = Date.now().toString(36);
    const english = `e2epit${suffix}`;
    const updatedEnglish = `e2epot${suffix}`;
    const phonemeSequence = "/p/ /ɪ/ /t/";

    await page.goto("/word-bank");
    await expect(
      page.getByRole("heading", { name: "Word bank", level: 1 }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Add word" }).click();
    const addDialog = page.getByRole("dialog", { name: "Add word" });
    await expect(addDialog).toBeVisible();

    await addDialog.getByLabel("English label").fill(english);
    await addDialog.getByLabel("Phoneme sequence").fill(phonemeSequence);
    await addDialog.getByRole("button", { name: "Save word" }).click();

    const wordBank = page.getByRole("list", { name: "Word bank" });
    await expect(wordBank.getByText(english, { exact: true })).toBeVisible();

    await page.getByRole("button", { name: `Edit ${english}` }).click();
    const editDialog = page.getByRole("dialog", { name: "Edit word" });
    await expect(editDialog).toBeVisible();
    await editDialog.getByLabel("English label").fill(updatedEnglish);
    await editDialog.getByRole("button", { name: "Save word" }).click();

    await expect(
      wordBank.getByText(updatedEnglish, { exact: true }),
    ).toBeVisible();
    await expect(wordBank.getByText(english, { exact: true })).toHaveCount(0);

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: `Delete ${updatedEnglish}` }).click();

    await expect(
      wordBank.getByText(updatedEnglish, { exact: true }),
    ).toHaveCount(0);
  });
});
