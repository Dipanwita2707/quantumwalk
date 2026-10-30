import { expect, test } from '@playwright/test';

const signedIn = { authenticated: true, id: 'redesign-user', display_name: 'Ada', email: 'ada@example.test', csrf_token: 'test-only' };

test.beforeEach(async ({ page }) => {
  await page.route('**/api/me', route => route.fulfill({ json: signedIn }));
  for (const endpoint of ['circuits', 'progress', 'lessons', 'challenges']) {
    await page.route(`**/api/${endpoint}`, route => route.fulfill({ json: [] }));
  }
});

test('dashboard explains empty saved work and opens the builder', async ({ page }) => {
  await page.goto('/dashboard');
  const recent = page.getByRole('region', { name: 'Recent experiments' });
  await expect(recent).toContainText('Saved circuits will appear here');
  await recent.getByRole('link', { name: 'Build your first circuit' }).click();
  await expect(page).toHaveURL(/workspace\?mode=circuit/);
});

test('dashboard exposes saved-work failure with a working retry', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/circuits', route => {
    attempts++;
    return attempts === 1 ? route.fulfill({ status: 503, json: { detail: 'Unavailable' } }) : route.fulfill({ json: [] });
  });
  await page.goto('/dashboard');
  const recent = page.getByRole('region', { name: 'Recent experiments' });
  await expect(recent.getByRole('alert')).toContainText('Saved circuits could not be loaded');
  await recent.getByRole('button', { name: 'Retry' }).click();
  await expect(recent).toContainText('Saved circuits will appear here');
});

test('mobile navigation closes on Escape and after a route change', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const menu = page.locator('.header-mobile-nav summary');
  await menu.focus();
  await page.keyboard.press('Enter');
  const nav = page.getByRole('navigation', { name: 'Mobile navigation' });
  await expect(nav).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(nav).not.toBeVisible();
  await expect(menu).toBeFocused();
  await page.keyboard.press('Enter');
  await nav.getByRole('link', { name: 'Learn', exact: true }).click();
  await expect(page).toHaveURL(/\/learn$/);
  await expect(nav).not.toBeVisible();
});

test('tool catalog has one card per tool and filters actual entries', async ({ page }) => {
  await page.goto('/hub');
  await expect(page.getByRole('heading', { name: 'Document Pro', exact: true })).toHaveCount(1);
  await page.getByRole('searchbox', { name: 'Search tools' }).fill('no-such-tool');
  await expect(page.getByRole('status')).toContainText('No tools match');
  await page.getByRole('button', { name: 'Reset filters' }).click();
  await expect(page.getByRole('heading', { name: 'Document Pro', exact: true })).toBeVisible();
});

test('Academy resumes at the first unfinished lesson using confirmed progress', async ({ page }) => {
  await page.route('**/api/lessons', route => route.fulfill({ json: [
    { slug: 'first-qubit', title: 'First qubit', level: 'beginner', minutes: 5, objective: 'Inspect a qubit', steps: [], algorithm_slug: 'bell', question: 'How many basis states does a qubit have?', choices: ['Two', 'Three'] },
  ] }));
  await page.route('**/api/progress', route => route.fulfill({ json: [{ activity_slug: 'lesson:first-qubit', completed: true, score: 100 }] }));
  await page.goto('/learn');
  const unit = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Foundations', exact: true }) });
  await expect(unit).toContainText('1/6 lessons');
  await expect(unit.getByRole('link', { name: 'Resume unit' })).toHaveAttribute('href', '/learn/math-amplitudes');
});

test('mobile Lab places its working area after a compact preset rail', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/me', route => route.fulfill({ json: { authenticated: false } }));
  await page.goto('/workspace?mode=circuit');
  const rail = page.locator('.lab-shell .sidebar');
  const circuit = page.locator('.circuit-panel');
  await expect(circuit).toBeVisible();
  const bounds = await rail.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.height).toBeLessThan(300);
  const workingArea = await page.locator('.lab-shell .main-column').boundingBox();
  expect(workingArea!.y - (bounds!.y + bounds!.height)).toBeLessThan(60);
});
