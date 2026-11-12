import assert from 'node:assert/strict';
import { PDFDocument, rgb } from 'pdf-lib';
import { chromium } from '@playwright/test';
import { zipSync, strToU8 } from 'fflate';

// 기능 하나가 완성될 때 TOOL을 지정해 작은 파일의 실제 처리와 다운로드만 확인한다.
const tool = process.env.TOOL;
const routes = {
  'pdf-edit': 'pdf-edit',
  'pdf-compress': 'pdf-compressor',
  'document-to-pdf': 'document-to-pdf',
};
assert(tool && routes[tool], 'TOOL 환경변수로 검사할 기능 하나를 지정하세요.');
async function makePdf(widths) {
  const pdf = await PDFDocument.create();
  widths.forEach((width) => {
    const page = pdf.addPage([width, 400]);
    page.drawRectangle({
      x: 20,
      y: 20,
      width: 100,
      height: 100,
      color: rgb(1, 0, 0),
    });
  });
  return Buffer.from(await pdf.save());
}
const first = await makePdf([200, 250, 300]);
const second = await makePdf([350]);
const inputs = [
  { name: '첫째.pdf', mimeType: 'application/pdf', buffer: first },
];
if (tool === 'pdf-edit') {
  inputs.splice(
    0,
    1,
    {
      name: '첫째.pdf',
      mimeType: 'application/pdf',
      buffer: await makePdf([200, 250]),
    },
    { name: '둘째.pdf', mimeType: 'application/pdf', buffer: second }
  );
}
if (tool === 'document-to-pdf') {
  const entries = {
    '[Content_Types].xml':
      '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    '_rels/.rels':
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    'word/document.xml':
      '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>작은 문서 변환 검사</w:t></w:r></w:p><w:sectPr/></w:body></w:document>',
  };
  inputs.splice(0, 1, {
    name: '과제.docx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: Buffer.from(
      zipSync(
        Object.fromEntries(
          Object.entries(entries).map(([name, value]) => [name, strToU8(value)])
        )
      )
    ),
  });
}
if (tool === 'document-to-pdf' && process.env.DOCUMENT_FORMAT === 'hwpx') {
  assert.equal(
    process.env.EXPECT_UNAVAILABLE,
    '1',
    '작은 구조 fixture는 실험 변환 설정 안내 검사에만 사용합니다.'
  );
  const entries = {
    mimetype: 'application/hwp+zip',
    'Contents/header.xml': '<head/>',
    'Contents/section0.xml': '<section/>',
    'Contents/content.hpf': '<package/>',
  };
  inputs.splice(0, 1, {
    name: '과제.hwpx',
    mimeType: 'application/hwp+zip',
    buffer: Buffer.from(
      zipSync(
        Object.fromEntries(
          Object.entries(entries).map(([name, value]) => [name, strToU8(value)])
        )
      )
    ),
  });
}
const browser = await chromium.launch({ args: ['--disable-gpu'] });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${process.env.WORKSPACE_PREVIEW_URL ?? 'http://localhost:3100'}/${routes[tool]}/`
  );
  const workspace = page.getByRole('region', {
    name: '파일 작업대',
    exact: true,
  });
  await page.locator('input[type=file]').setInputFiles(inputs);
  if (tool === 'pdf-edit') {
    const thumbnail = workspace.locator('[data-pdf-thumbnail]').first();
    await thumbnail.scrollIntoViewIfNeeded();
    await workspace
      .locator('[data-pdf-thumbnail][data-ready="true"]')
      .first()
      .waitFor();
    assert(
      await thumbnail.evaluate((canvas) => {
        if (!canvas.width || !canvas.height) return false;
        const pixels = canvas
          .getContext('2d')
          .getImageData(0, 0, canvas.width, canvas.height).data;
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i] > 150 && pixels[i + 1] < 100 && pixels[i + 2] < 100)
            return true;
        }
        return false;
      }),
      '작은 PDF 썸네일에 원본의 빨간 도형이 표시되어야 합니다.'
    );
    await page
      .getByRole('button', { name: '3번 페이지 앞으로 이동', exact: true })
      .click();
    await page
      .getByRole('button', { name: '2번 페이지 앞으로 이동', exact: true })
      .click();
    await page
      .getByRole('button', { name: '1번 페이지 회전', exact: true })
      .click();
    await page
      .getByRole('button', { name: '2번 페이지 삭제', exact: true })
      .click();
  }
  const actions = {
    'pdf-edit': 'PDF 저장',
    'pdf-compress': 'PDF 압축하기',
    'document-to-pdf': 'PDF로 변환하기',
  };
  await page.getByRole('button', { name: actions[tool], exact: true }).click();
  if (process.env.EXPECT_UNAVAILABLE === '1') {
    assert(
      ['pdf-compress', 'document-to-pdf'].includes(tool),
      '외부 프로그램 기능만 미설치 검사를 지원합니다.'
    );
    const alert = workspace.getByRole('alert');
    await alert.waitFor({ timeout: 15_000 });
    assert((await alert.textContent()).trim().length > 0);
    if (process.env.DOCUMENT_FORMAT === 'hwpx')
      assert.match(await alert.textContent(), /HWP·HWPX/);
    assert.equal(
      await page
        .getByRole('button', { name: actions[tool], exact: true })
        .isEnabled(),
      true
    );
    assert.equal(
      await page
        .getByRole('button', { name: '결과 다운로드', exact: true })
        .count(),
      0
    );
    assert.deepEqual(errors, []);
    console.log(
      `${tool}: 외부 프로그램 미설치 안내와 재시도 가능 상태 검증 통과. 실제 변환은 미검증.`
    );
  } else {
    const result = page.getByRole('button', {
      name: '결과 다운로드',
      exact: true,
    });
    await Promise.race([
      result.waitFor({ timeout: 80_000 }),
      workspace
        .getByRole('alert')
        .waitFor({ timeout: 80_000 })
        .then(async () => {
          throw new Error(
            `서버 처리 실패: ${await workspace.getByRole('alert').textContent()}`
          );
        }),
    ]);
    const waiting = page.waitForEvent('download');
    await result.click();
    const downloaded = await waiting;
    assert.equal(await downloaded.failure(), null);
    const stream = await downloaded.createReadStream();
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const bytes = Buffer.concat(chunks);
    const pdf = await PDFDocument.load(bytes);
    assert.equal(
      pdf.getPageCount(),
      tool === 'pdf-edit' ? 2 : tool === 'pdf-compress' ? 3 : 1
    );
    if (tool === 'pdf-edit') {
      assert.equal(pdf.getPage(0).getRotation().angle, 90);
      assert.equal(pdf.getPage(0).getWidth(), 350);
      assert.equal(pdf.getPage(1).getWidth(), 250);
    }
    if (tool === 'pdf-compress') assert(bytes.length <= first.length);
    assert.deepEqual(errors, []);
    console.log(`${tool}: 작은 파일 처리와 다운로드 검사 통과`);
  }
} finally {
  await browser.close();
}
