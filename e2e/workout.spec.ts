import { expect, test } from '@playwright/test';
export const STORAGE_STATE = 'storageState.json';

test.describe.serial('Workout Management', () => {
  // Use the stored authentication state for all tests in this file.
  test.use({ storageState: STORAGE_STATE });

  test.beforeEach(async ({ page }) => {
    // Navigate to the workout page before each test.
    await page.goto('/workout');
    const skeleton = page.getByTestId('skeleton-loader');
    await skeleton
      .waitFor({ state: 'attached', timeout: 2000 })
      .catch(() => {});

    // IMPORTANT: Wait for the initial data to load by ensuring the skeleton loader is gone.
    // This prevents a race condition where the test tries to count rows before they are rendered.
    await expect(skeleton).toBeHidden({ timeout: 15000 });

    await Promise.race([
      page
        .getByTestId('workout-session-row')
        .first()
        .waitFor({ state: 'visible', timeout: 15000 }),
      page
        .getByText(/No workout sessions recorded yet/i)
        .waitFor({ state: 'visible', timeout: 15000 }),
    ]).catch(() => {});
  });

  test('should allow a user to create a new workout session', async ({
    page,
  }) => {
    // Before creating a new session, get the initial count of rows.
    // The loading is already handled in beforeEach, so we can count immediately.
    const sessionRows = page.getByTestId('workout-session-row');
    const initialRowCount = await sessionRows.count();
    // Step 1: Click the button to open the session form.
    await page.getByRole('button', { name: 'Add New Session' }).click();
    await expect(
      page.getByRole('heading', { name: 'Create a New Session' })
    ).toBeVisible();

    // Step 2: Select an exercise using the custom combobox.
    await page.getByTestId('exercise-select').click();
    await page.getByPlaceholder('Search by name').fill('Bench Press');
    await page
      .getByRole('option', { name: 'Dumbbell Bench Press', exact: true })
      .click();

    // Step 3: Fill in the sets for the first exercise.
    await page.getByTestId('weight-input').fill('60');
    await page.getByTestId('reps-input').fill('10');

    // Add another set
    await page.getByRole('button', { name: 'Add Set' }).click();
    await page.getByTestId('weight-input').nth(1).fill('65');
    await page.getByTestId('reps-input').nth(1).fill('8');

    // Step 4: Add a second exercise.
    await page.getByRole('button', { name: 'Add Exercise' }).click();
    await page.getByTestId('exercise-select').nth(1).click();
    await page.getByPlaceholder('Search by name').fill('Cable Russian Twists');
    await page
      .getByRole('option', { name: 'Cable Russian Twists', exact: true })
      .click();

    // Step 5: Fill in the sets for the second exercise.
    await page.getByTestId('weight-input').nth(2).fill('100');
    await page.getByTestId('reps-input').nth(2).fill('5');

    // Step 6: Save the session.
    await page.getByRole('button', { name: 'Save Session' }).click();

    // Step 7: Verify the session was created successfully.
    // Check for the success toast with regex to match dynamic date.
    await expect(
      page.getByText(/Session for .* has been saved\./)
    ).toBeVisible();

    // Assert that the number of session rows has increased by one.
    await expect(sessionRows).toHaveCount(initialRowCount + 1);

    // Check if exercise name is visible in the history table after clicking on the row.
    await page.getByTestId('workout-session-row').first().click();
    await expect(
      page.getByRole('heading', { name: 'Dumbbell Bench Press' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Cable Russian Twists' })
    ).toBeVisible();
  });

  test('should allow a user to edit a workout session', async ({ page }) => {
    // Step 1: Locate the first session row and its edit button.
    const firstSessionRow = page.getByTestId('workout-session-row').first();
    const editButton = firstSessionRow.getByLabel(/Edit session on/);
    await editButton.click();

    // Step 2: Verify the edit form is open.
    await expect(
      page.getByRole('heading', { name: 'Edit Session' })
    ).toBeVisible();

    // Step 3: Edit the notes field.
    const notesInput = page.getByLabel('Notes');
    const uniqueNote = `Edited by Playwright at ${new Date().toISOString()}`;
    await notesInput.fill(uniqueNote);

    // Step 4: Save the changes.
    await page.getByRole('button', { name: 'Save Session' }).click();

    // Step 5: Verify the update was successful.
    await expect(
      page.getByText(/Session for .* has been updated\./)
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Edit Session' })
    ).not.toBeVisible();

    // Step 6: Re-open the session to verify the note was persisted.
    await firstSessionRow.click();

    await firstSessionRow.click();

    await expect(
      firstSessionRow.getByText(/Edited by Playwright/)
    ).toBeVisible();
  });

  test('should allow a user to delete a workout session', async ({ page }) => {
    // Step 1: Get the initial count of session rows.
    const sessionRows = page.getByTestId('workout-session-row');
    const initialRowCount = await sessionRows.count();
    console.log('[initialRowCount]', initialRowCount);

    // Ensure there is at least one session to delete.
    expect(initialRowCount).toBeGreaterThan(0);

    // Step 2: Locate the first session row and its delete button.
    const firstSessionRow = sessionRows.first();
    const deleteButton = firstSessionRow.getByLabel(/Delete session on/);
    await deleteButton.click();

    // Step 3: Confirm the deletion in the alert dialog.
    await expect(
      page.getByRole('heading', { name: 'Are you sure?' })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 4: Verify the success toast appears.
    await expect(
      page.getByText(/Session for .* has been deleted\./)
    ).toBeVisible();

    // Step 5: Verify the row count has decreased by one.
    await expect(sessionRows).toHaveCount(initialRowCount - 1);
  });
});
