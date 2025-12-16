import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Use local dev server (make sure `npm run dev` is running on port 3000)
});

test('events listing shows events', async ({ page }) => {
  await page.goto('http://localhost:3000/events/listing');
  await expect(page.locator('text=Découvrez les événements')).toBeVisible();
});
