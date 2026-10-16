import { expect, test } from '@playwright/test';

/**
 * Guest demo mode: visitors without a college email explore the app with sample data.
 */
test.describe('Guest demo mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/login');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: 'Explore as guest' }).click();
    await expect(page.getByText("You're exploring College Central with sample data.")).toBeVisible();
  });

  test('shows the demo student’s profile', async ({ page }) => {
    await page.goto('/#/profile');
    // The header's copy of the name is hidden on phones, so look for any visible one
    await expect(page.getByText('Aarav Mehta').filter({ visible: true }).first()).toBeVisible();
  });

  test('keeps changes across reloads until the demo is reset', async ({ page, isMobile }) => {
    test.skip(isMobile, 'On phones the bell sits inside the quick-actions menu');
    const bell = page.getByRole('button', { name: 'Notifications' }).first();
    const markAllRead = page.getByRole('button', { name: 'Mark all read' });

    await bell.click();
    await markAllRead.click();
    await page.reload();
    await bell.click();
    await expect(markAllRead).toHaveCount(0);
    await bell.click(); // close the dropdown, which otherwise covers the banner

    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Reset demo' }).click();
    await bell.click();
    await expect(markAllRead).toBeVisible();
  });

  test('lists only fictional students in the directory', async ({ page }) => {
    await page.goto('/#/directory');
    await page.getByRole('button', { name: /^Students/ }).click();
    await expect(page.getByRole('button', { name: /^Students\s*31$/ })).toBeVisible();
    await expect(page.getByText('AADI BISWAS')).toHaveCount(0); // first name in the real directory
  });

  test('cannot open the admin panel', async ({ page }) => {
    await page.goto('/#/admin');
    await expect(page).not.toHaveURL(/#\/admin/);
  });

  test('exit returns to the login page', async ({ page }) => {
    await page.getByRole('button', { name: 'Exit demo' }).click();
    await expect(page).toHaveURL(/#\/login/);
    await expect(page.getByRole('button', { name: 'Explore as guest' })).toBeVisible();
  });

  test('never talks to Firestore or Storage', async ({ page, context }) => {
    // The login page itself reads the public app config from Firestore. Close that tab and
    // open a fresh one, which boots straight into the demo (the flag is in localStorage)
    await page.close();
    const tab = await context.newPage();
    const firebaseRequests: string[] = [];
    tab.on('request', (request) => {
      if (/firestore\.googleapis\.com|firebasestorage\.googleapis\.com/.test(request.url())) {
        firebaseRequests.push(request.url());
      }
    });

    for (const path of [
      '/#/',
      '/#/grades',
      '/#/schedule',
      '/#/academic-calendar',
      '/#/college-forms',
      '/#/campus-map',
      '/#/directory',
      '/#/profile',
    ]) {
      await tab.goto(path);
      await tab.waitForLoadState('networkidle');
    }

    await expect(tab.getByText("You're exploring College Central with sample data.")).toBeVisible();
    expect(firebaseRequests).toEqual([]);
  });
});
