import { test, expect } from "@playwright/test";

test("iPad flow: recipe, ingredients, costs, plan, shopping, saved state and offline reopen", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "Recipes", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator("main")
      .evaluate((e) => e.scrollHeight <= e.clientHeight + 1),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Nutrients", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Work In Progress" }),
  ).toBeVisible();
  expect(
    await page
      .locator("main")
      .evaluate((e) => e.scrollHeight <= e.clientHeight + 1),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Recipes", exact: true }).click();
  await page.getByRole("button", { name: "New recipe", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("button", { name: "Close dialog" }),
  ).toBeFocused();
  await dialog
    .getByLabel("Recipe name", { exact: true })
    .fill("My test rice bowl");
  await dialog.getByRole("button", { name: "Create recipe" }).click();
  await page
    .getByRole("button", { name: "Add ingredient", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Ingredient name")).not.toBeFocused();
  await dialog.getByLabel("Ingredient name").fill("Rice");
  await dialog.getByLabel("Amount", { exact: true }).fill("300");
  await dialog.getByText("Pack price (optional)", { exact: true }).click();
  await dialog.getByLabel("Pack size (g)", { exact: true }).fill("500");
  await dialog.getByLabel("Price per pack (kr)", { exact: true }).fill("35,50");
  await dialog
    .getByRole("combobox", { name: "Availability", exact: true })
    .selectOption("found");
  await dialog.getByRole("button", { name: "Add to recipe" }).click();
  await expect(
    page.getByRole("button", { name: "Edit Rice", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add ingredient", exact: true }),
  ).toBeFocused();
  await expect(page.getByText("21,30 kr", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "More servings", exact: true })
    .click();
  await expect(page.getByText("375 g", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Fewer servings", exact: true })
    .click();
  await page.screenshot({
    path: "test-results/recipe-ipad.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Plan this recipe" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add to week", exact: true })
    .click();
  await page.getByRole("button", { name: "Shopping", exact: true }).click();
  await expect(page.getByText("Rice", { exact: true })).toBeVisible();
  await expect(page.getByText(/1 pack × 500 g/)).toBeVisible();
  await expect(page.getByText("35,50 kr", { exact: true })).toBeVisible();
  await page
    .getByRole("checkbox", { name: "Bought Rice", exact: true })
    .check();
  await expect(page.getByText("0,00 kr", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Shopping", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Bought Rice", exact: true }),
  ).toBeChecked();
  await page
    .getByRole("button", { name: "Settings & backup", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  const downloadPromise = page.waitForEvent("download");
  await dialog
    .getByRole("button", { name: "Export backup", exact: true })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^This-Weeks-Recipe-.*\.json$/);
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  await page.setViewportSize({ width: 1180, height: 820 });
  await page.getByRole("button", { name: "This week", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "This week", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Nutrients", exact: true }).click();
  expect(
    await page
      .locator("main")
      .evaluate((e) => e.scrollHeight <= e.clientHeight + 1),
  ).toBeTruthy();
  await page.waitForFunction(() =>
    navigator.serviceWorker.controller?.scriptURL.includes(
      "/This-Weeks-Recipe/sw.js",
    ),
  );
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Recipes", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Open My test rice bowl", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Shopping", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Bought Rice", exact: true }),
  ).toBeChecked();
  expect(errors).toEqual([]);
});

test("compact layout does not overflow; invalid prices are caught before saving", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  await page.getByRole("button", { name: "New recipe", exact: true }).click();
  await page.getByLabel("Recipe name", { exact: true }).fill("Quick test");
  await page.getByRole("button", { name: "Create recipe" }).click();
  await page
    .getByRole("button", { name: "Add ingredient", exact: true })
    .click();
  await page.getByLabel("Ingredient name").fill("Test item");
  await page.getByLabel("Amount", { exact: true }).fill("-20");
  await page.getByRole("button", { name: "Add to recipe" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "amount greater than zero",
  );
  await page.getByLabel("Amount", { exact: true }).fill("10");
  await page.getByRole("button", { name: "Add to recipe" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Nutrients", exact: true }).click();
  expect(
    await page
      .locator("main")
      .evaluate((e) => e.scrollHeight <= e.clientHeight + 1),
  ).toBeTruthy();
});
