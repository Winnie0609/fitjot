import { expect, test } from '@playwright/test';

test.describe('Authentication', () => {
  // This file will store the authentication state.
  const storageStateFile = 'storageState.json';

  test('should allow a user to log in and be redirected to the dashboard', async ({
    page,
  }) => {
    // 1. Navigate to the login page
    await page.goto('/login');

    // 2. Fill in the login form
    // Using getByLabel is a best practice as it mimics how users interact with forms.
    await page.getByLabel('Email').fill('test-user@example.com');
    // Use getByRole for password field to avoid matching the "Show password" button
    await page.getByRole('textbox', { name: 'Password' }).fill('password123');

    // 3. Click the login button
    await page.getByRole('button', { name: 'Login', exact: true }).click();

    // 4. Wait for successful login and redirection
    // First, wait for the success toast to appear
    await expect(
      page.getByText('You have successfully logged in!')
    ).toBeVisible({ timeout: 10000 });

    // Then wait for navigation to the dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });

    // Finally, verify the dashboard content is loaded
    await expect(
      page.getByRole('heading', { name: /Welcome Back/ })
    ).toBeVisible({ timeout: 10000 });

    // 5. Save the authentication state to a file
    // This is the crucial step that allows other tests to bypass the login UI.
    await page.context().storageState({ path: storageStateFile });
  });

  test('should show an error message with invalid credentials', async ({
    page,
  }) => {
    // 1. Navigate to the login page
    await page.goto('/login');

    // 2. Fill in the form with incorrect credentials
    await page.getByLabel('Email').fill('wrong-user@example.com');
    // await page.getByLabel('Password').fill('wrongpassword');
    // Use getByRole for password field to avoid matching the "Show password" button
    await page.getByRole('textbox', { name: 'Password' }).fill('wrongpassword');

    // 3. Click the login button
    await page.getByRole('button', { name: 'Login', exact: true }).click();

    // 4. Verify that an error message is displayed
    // The text should match the error toast shown in the application.
    await expect(page.getByText('Invalid email or password.')).toBeVisible({
      timeout: 15000,
    });

    // 5. Verify the user remains on the login page
    await expect(page).toHaveURL('/login');
  });
});
