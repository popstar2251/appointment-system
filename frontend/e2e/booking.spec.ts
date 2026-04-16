import { test, expect } from '@playwright/test';

// Happy path: a visitor fills out the booking form and sees the success screen.
// The backend must be running on port 3000 for this test to pass.
// n8n is NOT required — webhook calls are fire-and-forget and failures are swallowed.
test('public booking form — happy path', async ({ page }) => {
  await page.goto('/book');

  // Fill in all required fields
  await page.getByLabel('Full name').fill('Test User');
  await page.getByLabel('Phone').fill('+5491155667788');
  await page.getByLabel('Email').fill('testuser@example.com');

  // Use a date far in the future to pass the past-date validation
  await page.getByLabel('Date').fill('2099-12-31');
  await page.getByLabel('Time').fill('10:00');

  // Open the service dropdown and pick the first option
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'General Consultation' }).click();

  // Submit
  await page.getByRole('button', { name: 'Book appointment' }).click();

  // Success state: the form is replaced by a confirmation message
  await expect(page.getByText('Appointment booked!')).toBeVisible({ timeout: 5000 });
});
