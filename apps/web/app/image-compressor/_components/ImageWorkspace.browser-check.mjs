import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

// 실제 코덱과 Worker, 파일 저장은 Node mock 테스트와 별도로 브라우저에서 검사한다.
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  const uploads = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (
      !['GET', 'HEAD'].includes(request.method()) ||
      request.postData() !== null
    )
      uploads.push({
        url: request.url(),
        method: request.method(),
        body: request.postData(),
      });
  });
  const base = process.env.TOOLBAX_PREVIEW_URL || 'http://127.0.0.1:4173';
  await page.goto(`${base}/image-compressor/`);
  const add = page.getByRole('button', {
    name: '현재 이미지를 지우고 새 이미지 선택',
  });
  const download = page.getByRole('button', {
    name: '현재 이미지 결과 다운로드',
  });
  assert.equal(await add.count(), 1);
  assert.equal(await download.count(), 1);
  assert.equal(
    await page.locator('input[type=file]').getAttribute('multiple'),
    null
  );
  const initialSlider = page.getByRole('slider', { name: '용량 감소 목표' });
  assert.equal(await initialSlider.count(), 0);
  const fixtures = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const context = canvas.getContext('2d');
    const data = context.createImageData(512, 320);
    let seed = 7;
    for (let i = 0; i < data.data.length; i += 4) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      data.data[i] = seed & 255;
      data.data[i + 1] = (seed >>> 8) & 255;
      data.data[i + 2] = (seed >>> 16) & 255;
      data.data[i + 3] = 255;
    }
    context.putImageData(data, 0, 0);
    return ['image/jpeg', 'image/webp', 'image/png'].map((type) => ({
      type,
      base64: canvas.toDataURL(type, 1).split(',')[1],
    }));
  });
  let optimisedPng;
  for (const fixture of fixtures) {
    const extension =
      fixture.type === 'image/jpeg' ? 'jpg' : fixture.type.split('/')[1];
    let input = Buffer.from(fixture.base64, 'base64');
    // PNG 뒤의 무의미한 바이트를 제거해도 픽셀은 동일해야 한다.
    if (extension === 'png')
      input = Buffer.concat([input, Buffer.alloc(200000)]);
    const chooserPromise = page.waitForEvent('filechooser');
    await add.click();
    await (
      await chooserPromise
    ).setFiles({
      name: `사진.${extension}`,
      mimeType: fixture.type,
      buffer: input,
    });
    await download.waitFor();
    await page.waitForFunction(
      () =>
        !document.querySelector(
          'button[aria-label="현재 이미지 결과 다운로드"]'
        ).disabled,
      { timeout: 30000 }
    );
    assert.equal(await page.locator('figure img').count(), 2);
    assert.equal(
      await page
        .locator('figure img')
        .first()
        .evaluate((element) => getComputedStyle(element).objectFit),
      'contain'
    );
    const result = page.getByAltText('압축 결과 미리보기');
    const urls = await page
      .locator('figure img')
      .evaluateAll((images) => images.map((image) => image.src));
    const bytes = await result.evaluate(async (image) =>
      Array.from(new Uint8Array(await (await fetch(image.src)).arrayBuffer()))
    );
    assert(bytes.length <= input.length);
    const downloadPromise = page.waitForEvent('download');
    await download.click();
    const saved = await downloadPromise;
    assert.equal(saved.suggestedFilename(), `사진.${extension}`);
    const chunks = [];
    for await (const chunk of await saved.createReadStream())
      chunks.push(chunk);
    assert.deepEqual(Buffer.concat(chunks), Buffer.from(bytes));
    if (extension === 'png') {
      optimisedPng = Buffer.from(bytes);
      assert(
        await page.locator('figure img').evaluateAll(async (images) => {
          const pixels = await Promise.all(
            images.map(async (image) => {
              await image.decode();
              const canvas = document.createElement('canvas');
              canvas.width = image.naturalWidth;
              canvas.height = image.naturalHeight;
              const context = canvas.getContext('2d');
              context.drawImage(image, 0, 0);
              return context.getImageData(0, 0, canvas.width, canvas.height)
                .data;
            })
          );
          return pixels[0].every((value, index) => value === pixels[1][index]);
        })
      );
      await page.screenshot({
        path: '/tmp/toolbax-compression.png',
        fullPage: true,
      });
    }
    console.log(
      `${extension}: ${input.length}B → ${bytes.length}B, 미리보기/다운로드 일치`
    );
    const original = page.locator('figure').first().locator('img');
    if (extension === 'png') {
      assert.equal(
        await page.getByRole('slider', { name: '용량 감소 목표' }).count(),
        0
      );
      assert(await page.getByText('PNG · 무손실 압축').isVisible());
    } else {
      const slider = page.getByRole('slider', { name: '용량 감소 목표' });
      assert.equal(await slider.inputValue(), '70');
      for (const width of [1440, 1280, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        const panel = await slider.locator('..').boundingBox();
        const photo = await page.locator('figure').last().boundingBox();
        const button = await download.boundingBox();
        assert(panel.y > photo.y + photo.height);
        if (width >= 1280) {
          assert(Math.abs(panel.width - 420) < 1);
          assert(Math.abs(panel.x + panel.width / 2 - width / 2) < 2);
          assert(button.x > panel.x + panel.width);
        }
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
      assert(bytes.length <= Math.floor(input.length * 0.3));
      await page.screenshot({
        path: `/tmp/toolbax-target-${extension}.png`,
        fullPage: true,
      });
      await slider.press('Home');
      await page.waitForFunction(
        () =>
          !document.querySelector(
            'button[aria-label="현재 이미지 결과 다운로드"]'
          ).disabled
      );
      assert.equal(await slider.inputValue(), '0');
      const unchanged = await result.evaluate(async (image) =>
        Array.from(new Uint8Array(await (await fetch(image.src)).arrayBuffer()))
      );
      assert.deepEqual(Buffer.from(unchanged), input);
      await slider.press('Home');
      await slider.press('End');
      await slider.press('ArrowLeft');
      await page.waitForFunction(
        () =>
          !document.querySelector(
            'button[aria-label="현재 이미지 결과 다운로드"]'
          ).disabled
      );
      assert.equal(await slider.inputValue(), '98');
      const latestBytes = await result.evaluate(async (image) =>
        Array.from(new Uint8Array(await (await fetch(image.src)).arrayBuffer()))
      );
      if (latestBytes.length > Math.floor(input.length * 0.02)) {
        assert(
          (await page.locator('p[role=status]').textContent()).includes(
            '목표 98% 감소에 미달'
          )
        );
      } else {
        assert(
          !(await page.locator('p[role=status]').textContent()).includes('미달')
        );
      }
      const latestDownload = page.waitForEvent('download');
      await download.click();
      const latestChunks = [];
      for await (const chunk of await (await latestDownload).createReadStream())
        latestChunks.push(chunk);
      assert.deepEqual(Buffer.concat(latestChunks), Buffer.from(latestBytes));
    }
    assert.equal(await page.getByRole('spinbutton').count(), 0);
    assert.equal(await page.getByRole('checkbox').count(), 0);
    assert.equal(await original.getAttribute('src'), urls[0]);
    assert(
      await page
        .locator('figure')
        .last()
        .getByText('512 × 320', { exact: true })
        .isVisible()
    );
    const nextChooser = page.waitForEvent('filechooser');
    await add.click();
    await (await nextChooser).setFiles([]);
    assert.equal(await page.locator('figure img').count(), 0);
    assert.equal(await initialSlider.count(), 0);
    assert(await download.isDisabled());
    for (const url of urls)
      assert(
        await page.evaluate(async (oldUrl) => {
          try {
            await fetch(oldUrl);
            return false;
          } catch {
            return true;
          }
        }, url)
      );
  }
  const invalidChooser = page.waitForEvent('filechooser');
  await add.click();
  await (
    await invalidChooser
  ).setFiles({
    name: '손상.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('이미지가 아님'),
  });
  await page
    .locator('p[role=status]')
    .filter({ hasText: '손상되었거나 지원하지 않는' })
    .waitFor();
  assert(await download.isDisabled());
  const recovery = page.waitForEvent('filechooser');
  await add.click();
  await (
    await recovery
  ).setFiles({
    name: '이미-압축.png',
    mimeType: 'image/png',
    buffer: optimisedPng,
  });
  await page.getByText('용량이 줄지 않아 원본을 유지했습니다.').waitFor();
  const unchanged = await page
    .getByAltText('압축 결과 미리보기')
    .evaluate(async (image) =>
      Array.from(new Uint8Array(await (await fetch(image.src)).arrayBuffer()))
    );
  assert.deepEqual(Buffer.from(unchanged), optimisedPng);
  await page.setViewportSize({ width: 390, height: 900 });
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  const tiny = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/jpeg', 1).split(',')[1];
  });
  const tinyChooser = page.waitForEvent('filechooser');
  await add.click();
  await (
    await tinyChooser
  ).setFiles({
    name: '목표미달.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from(tiny, 'base64'),
  });
  await page
    .locator('p[role=status]')
    .filter({ hasText: '목표 70% 감소에 미달' })
    .waitFor();
  assert(!(await download.isDisabled()));
  assert(
    await page
      .locator('figure')
      .last()
      .getByText('1 × 1', { exact: true })
      .isVisible()
  );
  // 새 파일을 고르려는 순간 처리 중인 Worker가 종료되어 늦은 결과가 나타나면 안 된다.
  const next = page.waitForEvent('filechooser');
  await add.click();
  await (
    await next
  ).setFiles({
    name: '취소.png',
    mimeType: 'image/png',
    buffer: Buffer.from(fixtures[2].base64, 'base64'),
  });
  const cancel = page.waitForEvent('filechooser');
  await add.click();
  await (await cancel).setFiles([]);
  await page.waitForTimeout(500);
  assert.equal(await page.locator('figure img').count(), 0);
    assert.equal(await initialSlider.count(), 0);
  assert(await download.isDisabled());
  for (const width of [1440, 1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    );
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(uploads, []);
  console.log(
    '목표 감소율·0% 원본 유지·미달 안내·PNG 픽셀 보존·다운로드 일치·취소·서버 미전송 검사 통과'
  );
} finally {
  await browser.close();
}
