import { expect, test } from "@playwright/test";

test.describe("@wall-smoke", () => {
  test("published snapshot wall loads spatial chrome", async ({ page }) => {
    await page.goto("/wall?snapshot=baseline");
    await expect(page).toHaveURL(/\/wall\?snapshot=baseline$/);
    await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Zoom out" })).toBeVisible();
  });

  test("unauthenticated wall route still redirects to login", async ({ page }) => {
    await page.goto("/wall");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });
});
