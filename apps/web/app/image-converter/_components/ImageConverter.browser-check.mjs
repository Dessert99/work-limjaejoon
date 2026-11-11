import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { unzipSync } from 'fflate';

const browser = await chromium.launch({
  args: ['--disable-gpu'],
  headless: true,
});
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const writes = [];
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url());
  });
  const base = process.env.WORKSPACE_PREVIEW_URL ?? 'http://127.0.0.1:4173';
  // 도구 화면만 열고 작은 2장으로 코덱과 ZIP 경계를 확인한다.
  await page.goto(`${base}/image-converter/`);
  const fixture = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    context.fillStyle = '#e56732';
    context.fillRect(0, 0, 64, 32);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.getByLabel('JPG·PNG·WebP 이미지 선택 (최대 30장)').setInputFiles(
    [1, 2].map(() => ({
      name: '사진.png',
      mimeType: 'image/png',
      buffer: Buffer.from(fixture, 'base64'),
    }))
  );
  await page.getByLabel('출력 형식').selectOption('image/webp');
  await page.getByLabel('긴 변 최대 크기 (px)').fill('16');
  const current = page.getByRole('button', {
    name: '현재 결과 다운로드',
    exact: true,
  });
  await page.waitForFunction(() => !document.querySelector('button')?.disabled);
  await page.getByText('변환 결과 ·').filter({ hasText: '16 × 8' }).waitFor();
  const bytes = Buffer.from(
    await page
      .getByAltText('변환 결과 미리보기')
      .evaluate(async (image) =>
        Array.from(new Uint8Array(await (await fetch(image.src)).arrayBuffer()))
      )
  );
  async function downloadBytes(button) {
    const waiting = page.waitForEvent('download');
    await button.click();
    const download = await waiting;
    const chunks = [];
    for await (const chunk of await download.createReadStream())
      chunks.push(chunk);
    return { name: download.suggestedFilename(), bytes: Buffer.concat(chunks) };
  }
  const one = await downloadBytes(current);
  assert.equal(one.name, '사진.webp');
  assert.deepEqual(one.bytes, bytes);
  const zip = await downloadBytes(
    page.getByRole('button', { name: '전체 ZIP 다운로드', exact: true })
  );
  const entries = unzipSync(zip.bytes);
  assert.deepEqual(Object.keys(entries), ['1-사진.webp', '2-사진.webp']);
  assert.deepEqual(Buffer.from(entries['1-사진.webp']), bytes);
  const oldUrl = await page
    .getByAltText('변환 결과 미리보기')
    .getAttribute('src');
  await page.getByLabel('긴 변 최대 크기 (px)').fill('8');
  assert(await current.isDisabled());
  await page.getByText('변환 결과 ·').filter({ hasText: '8 × 4' }).waitFor();
  assert(
    await page.evaluate(async (url) => {
      try {
        await fetch(url);
        return false;
      } catch {
        return true;
      }
    }, oldUrl)
  );
  assert.deepEqual(writes, []);
  assert.deepEqual(errors, []);
  console.log(
    '이미지 형식·크기 변환, 미리보기·다운로드·ZIP 일치, 최신 설정·URL 해제·서버 미전송 통과'
  );
} finally {
  await browser.close();
}
