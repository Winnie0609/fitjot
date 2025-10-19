import { expect, test } from '@playwright/test';
export const STORAGE_STATE = 'storageState.json';

test.describe.serial('Inbody Management', () => {
  test.use({ storageState: STORAGE_STATE });

  test.beforeEach(async ({ page }) => {
    // Navigate to the workout page before each test.
    await page.goto('/inbody');
    const skeleton = page.getByTestId('skeleton-loader');
    await skeleton
      .waitFor({ state: 'attached', timeout: 2000 })
      .catch(() => {});

    // IMPORTANT: Wait for the initial data to load by ensuring the skeleton loader is gone.
    // This prevents a race condition where the test tries to count rows before they are rendered.
    await expect(skeleton).toBeHidden({ timeout: 15000 });

    await Promise.race([
      page
        .getByTestId('inbody-record-row')
        .first()
        .waitFor({ state: 'visible', timeout: 15000 }),
      page
        .getByText(/No inbody records recorded yet/i)
        .waitFor({ state: 'visible', timeout: 15000 }),
    ]).catch(() => {});
  });

  test('should allow a user to create a new inbody record', async ({
    page,
  }) => {
    const recordRows = page.getByTestId('inbody-record-row');
    const initialRowCount = await recordRows.count();
    const firstRecordRow = recordRows.first();

    console.log('[initialRowCount]', initialRowCount);

    await page.getByRole('button', { name: 'Add New Record' }).click();
    await expect(
      page.getByRole('heading', { name: 'Create a New Record' })
    ).toBeVisible();

    await page.getByLabel(/Weight/).fill('50');
    await page.getByLabel(/PBF/).fill('20');
    await page.getByLabel(/InBody Score/).fill('71');
    await page.getByRole('button', { name: 'Save Quick Log' }).click();
    await expect(
      page.getByText(/InBody record for .* has been saved\./)
    ).toBeVisible();

    await expect(recordRows).toHaveCount(initialRowCount + 1);

    await expect(firstRecordRow.getByText('50', { exact: true })).toBeVisible();
    await expect(firstRecordRow.getByText('20', { exact: true })).toBeVisible();
    await expect(firstRecordRow.getByText('71', { exact: true })).toBeVisible();
  });

  test('should allow a user to edit an inbody record', async ({ page }) => {
    const firstRecordRow = page.getByTestId('inbody-record-row').first();
    const editButton = firstRecordRow.getByLabel(/Edit record on/);
    await editButton.click();

    await expect(
      page.getByRole('heading', { name: 'Edit InBody Record' })
    ).toBeVisible();

    await page.getByLabel(/Weight/).fill('57');
    await page.getByLabel(/PBF/).fill('28');
    await page.getByLabel(/InBody Score/).fill('71');
    await page.getByRole('button', { name: 'Save Record' }).click();
    await expect(
      page.getByText(/InBody record for .* has been updated\./)
    ).toBeVisible();

    await expect(firstRecordRow.getByText('57', { exact: true })).toBeVisible();
    await expect(firstRecordRow.getByText('28', { exact: true })).toBeVisible();
    await expect(firstRecordRow.getByText('71', { exact: true })).toBeVisible();
  });

  test('should allow a user to delete an inbody record', async ({ page }) => {
    const recordRows = page.getByTestId('inbody-record-row');
    const initialRowCount = await recordRows.count();
    const firstRecordRow = recordRows.first();

    expect(initialRowCount).toBeGreaterThan(0);

    console.log('[initialRowCount]', initialRowCount);

    const deleteButton = firstRecordRow.getByLabel(/Delete record on/);
    await deleteButton.click();

    await expect(
      page.getByRole('heading', { name: 'Are you sure?' })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(
      page.getByText(/InBody record for .* has been deleted\./)
    ).toBeVisible();

    await expect(recordRows).toHaveCount(initialRowCount - 1);
  });
});
