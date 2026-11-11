import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

const base = process.env.WORKSPACE_PREVIEW_URL ?? 'http://127.0.0.1:4173';
const browser = await chromium.launch({
  args: ['--disable-gpu'],
  headless: true,
});
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const writes = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH'].includes(request.method()))
      writes.push(request.url());
  });
  // 도구 경로로 직접 접속해 홈의 3D 장면을 불러오지 않는다.
  await page.goto(`${base}/character-counter/`);
  const input = page.getByLabel('계산할 글');
  await input.fill('한글 👩‍💻');
  await page
    .locator('[data-count="공백 포함"]')
    .filter({ hasText: '4 자' })
    .waitFor();
  assert.equal(
    (await page.locator('[data-count="공백 제외"]').textContent()).trim(),
    '3 자'
  );
  assert.equal(
    (await page.locator('[data-count="UTF-8"]').textContent()).trim(),
    '18 byte'
  );
  assert.equal(
    (await page.locator('[data-count="EUC-KR 방식"]').textContent()).trim(),
    '11 byte'
  );
  // 입력이 저장된 별도 탭에서 복원을 확인해 기존 탭의 미저장 상태를 건드리지 않는다.
  const restored = await context.newPage();
  await restored.goto(`${base}/character-counter/`);
  await restored.getByLabel('계산할 글').filter({ visible: true }).waitFor();
  await restored.waitForFunction(
    () => document.querySelector('#character-text')?.value === '한글 👩‍💻'
  );
  assert.deepEqual(writes, []);
  console.log('글자 수 계산·초안 복원·입력 서버 미전송 검증 통과');
} finally {
  await browser.close();
}
