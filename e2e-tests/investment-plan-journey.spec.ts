import { expect, test } from "@playwright/test";

test("demo saver reviews and confirms an investment plan", async ({ page }) => {
  await page.goto("/login");

  await page.getByRole("button", { name: "Continue as demo" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Progress looks good on you." })).toBeVisible();

  await page.getByRole("button", { name: /YOUR INVESTMENT PLAN.*Balanced/i }).click();
  await expect(page).toHaveURL(/\/plans$/);
  await expect(page.getByRole("heading", { name: "Choose your investment plan" })).toBeVisible();
  await expect(page.getByText("Projected returns are not guaranteed.")).toBeVisible();

  await page.getByRole("button", { name: /Moderate-High Growth.*10\.0%/i }).click();
  await expect(page.getByText(/You selected Growth, with a 10\.0% illustrative annual return assumption\./)).toBeVisible();

  await page.getByRole("button", { name: "Confirm selection" }).click();
  await expect(page.getByText("Plan selection confirmed. Future contributions will use Growth.")).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByRole("button", { name: /YOUR INVESTMENT PLAN.*Growth.*10\.0%/i })).toBeVisible();
});
