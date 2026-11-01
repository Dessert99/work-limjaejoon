import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
await page.goto(process.env.PREVIEW_URL ?? 'http://localhost:3100');
await page
  .getByRole('status')
  .filter({ hasText: '재생 완료' })
  .waitFor({ timeout: 120000 });

console.log('상태', await page.getByRole('status').allTextContents());
const held = await page.locator('canvas').screenshot();
await page.waitForTimeout(700);
assert.deepEqual(await page.locator('canvas').screenshot(), held);
await page.getByRole('button', { name: '다시 재생' }).click();
await page.getByRole('status').filter({ hasText: '재생 중' }).waitFor();
await page.waitForTimeout(3100);

await page
  .getByRole('status')
  .filter({ hasText: '재생 완료' })
  .waitFor({ timeout: 30000 });
assert.deepEqual(errors, []);
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.getByRole('status').filter({ hasText: '동작 줄이기' }).waitFor();
assert.equal(
  await page.getByRole('button', { name: '다시 재생' }).isDisabled(),
  true
);
await page.setViewportSize({ width: 390, height: 844 });

console.log(
  '통과: 실제 GLB 렌더링, 재생 완료, 클릭 재생, 동작 줄이기, 모바일 화면, 브라우저 오류 없음'
);
await browser.close();
const unsupported = await chromium.launch({ args: ['--disable-webgl'] });
const fallback = await unsupported.newPage();
await fallback.goto(process.env.PREVIEW_URL ?? 'http://localhost:3100');
await fallback
  .getByRole('status')
  .filter({ hasText: '3D를 표시할 수 없어' })
  .waitFor();
await fallback.getByAltText('금빛 주머니가 열린 검정 가방 캐릭터').waitFor();
console.log('통과: WebGL 미지원 정지 이미지 대체');
await unsupported.close();
