import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const browser = await chromium.launch({ headless: true });
const dir = '../docs/ux-refinement/redesign';
await mkdir(dir, { recursive: true });
const page = await browser.newPage({ reducedMotion: 'reduce' });
await page.route('**/api/me', route => route.fulfill({ json: { authenticated: false, google_enabled: true } }));
// Exercise honest offline states when no API server is available.
await page.route('**/api/lessons', route => route.fulfill({ status: 503, json: { detail: 'API unavailable during visual review' } }));
await page.route('**/api/challenges', route => route.fulfill({ status: 503, json: { detail: 'API unavailable during visual review' } }));
for (const width of [390, 768, 1440, 1600]) {
  await page.setViewportSize({ width, height: 1000 });
  for (const route of ['/', '/dashboard', '/learn', '/workspace', '/explorer', '/hub', '/login']) {
    await page.goto(`http://localhost:3000${route}`);
    await page.locator('main').first().waitFor();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({ path: `${dir}/${process.env.CAPTURE_LABEL ?? 'after'}-${route.replaceAll('/', '') || 'home'}-${width}.png` });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    console.log(`${width} ${route} overflow=${overflow}`);
  }
}
await browser.close();
