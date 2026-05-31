import { expect, test, type Page } from '@playwright/test';

const previewUser = {
  id: 'preview-dev-e2e',
  email: 'dev@demo.lingkodani.local',
  name: 'Superadmin Preview',
  title: 'Municipal Support / Superadmin',
  phone: '09171234567',
  role: 'developer',
  preferredWorkspace: 'detailed',
  status: 'active',
  barangay: 'Batakil',
  createdAt: '2026-05-26T08:00:00.000Z',
  updatedAt: '2026-05-26T08:00:00.000Z',
} as const;

async function enableSuperadminPreview(page: Page) {
  await page.context().addCookies([
    {
      name: 'lingkod_ani_demo_preview',
      value: '1',
      url: 'http://localhost:3000',
    },
    {
      name: 'lingkod_ani_demo_preview_profile',
      value: encodeURIComponent(JSON.stringify({ role: 'developer', preferredWorkspace: 'detailed' })),
      url: 'http://localhost:3000',
    },
  ]);
}

async function hydrateSuperadminPreview(page: Page) {
  await page.evaluate((user) => {
    window.localStorage.setItem('lingkodAniDemoPreviewUser', JSON.stringify(user));
    window.dispatchEvent(new Event('lingkod-ani-demo-preview-change'));
  }, previewUser);
}

test.describe('Lingkod-Ani critical flows', () => {
  test.beforeEach(async ({ page }) => {
    await enableSuperadminPreview(page);
  });

  test('superadmin preview can open the privileged dashboard', async ({ page }) => {
    await page.goto('/dashboard/developer');
    await hydrateSuperadminPreview(page);

    await expect(page.getByRole('heading', { name: 'Superadmin User Management' })).toBeVisible();
    await expect(page.getByText('Platform Superadmin Access')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Secure Superadmin Provisioning' })).toBeVisible();
  });

  test('reports page exposes custom ranges and farmer demographics', async ({ page }) => {
    await page.goto('/dashboard/reports');
    await hydrateSuperadminPreview(page);

    await expect(page.getByRole('heading', { name: 'Mga Ulat at Pagsusuri' })).toBeVisible();
    await expect(page.locator('input[type="date"]').first()).toBeVisible();
    await expect(page.locator('input[type="date"]').nth(1)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Apply Custom Range' })).toBeVisible();

    await page.getByRole('tab', { name: 'Demograpiko ng Magsasaka' }).click();
    await expect(page.getByText('Farmers in Scope')).toBeVisible();
    await expect(page.getByText('Average Farmer Age')).toBeVisible();
    await expect(page.getByText('Gender Distribution')).toBeVisible();
    await expect(page.getByText('Top Crop Profiles')).toBeVisible();
  });

  test('export center downloads filtered CSV and PDF exports', async ({ page }) => {
    await page.goto('/dashboard/export-center');
    await hydrateSuperadminPreview(page);

    await expect(page.getByText('Flexible Report Export')).toBeVisible();
    await page.getByRole('button', { name: 'Custom Range' }).click();
    await page.locator('input[type="date"]').nth(1).fill('2026-05-01');
    await page.locator('input[type="date"]').nth(2).fill('2026-05-26');
    await page.getByRole('button', { name: 'Apply Range' }).click();

    const csvDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download CSV' }).first().click();
    const csv = await csvDownload;
    expect(csv.suggestedFilename()).toContain('.csv');

    const pdfDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).first().click();
    const pdf = await pdfDownload;
    expect(pdf.suggestedFilename()).toContain('.pdf');
  });

  test('archive management downloads archive history exports', async ({ page }) => {
    await page.goto('/dashboard/archive-management');
    await hydrateSuperadminPreview(page);

    await expect(page.getByRole('heading', { name: 'Archive Management' })).toBeVisible();
    await expect(page.getByText('Archive Controls')).toBeVisible();

    const csvDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download CSV' }).first().click();
    const csv = await csvDownload;
    expect(csv.suggestedFilename()).toContain('.csv');

    const pdfDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download PDF' }).first().click();
    const pdf = await pdfDownload;
    expect(pdf.suggestedFilename()).toContain('.pdf');
  });
});
