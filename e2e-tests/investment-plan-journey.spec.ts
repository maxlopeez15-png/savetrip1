import { expect, test } from "@playwright/test";

test("registration blocks mismatched passwords before account creation", async ({ page }) => {
  await page.goto("/login");

  await page.getByRole("button", { name: "Create one" }).click();
  await page.getByLabel("Full name").fill("Test User");
  await page.getByLabel("Email").fill("test1@example.com");
  await page.getByPlaceholder("Create a secure password").fill("Password123");
  await page.getByPlaceholder("Repeat your password").fill("Password456");
  await page.getByRole("checkbox").check();

  await expect(page.getByText("Passwords do not match.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create account" })).toBeDisabled();
  await expect(page).toHaveURL(/\/login$/);
});
