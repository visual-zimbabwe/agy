import { expect, test } from "@playwright/test";

test("landing route loads with primary CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Open Wall" })).toBeVisible();
});

test("unauthenticated wall route redirects to login", async ({ page }) => {
  await page.goto("/wall");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("published snapshot route remains accessible", async ({ page }) => {
  await page.goto("/wall?snapshot=baseline");
  await expect(page).toHaveURL(/\/wall\?snapshot=baseline$/);
  await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible();
});
