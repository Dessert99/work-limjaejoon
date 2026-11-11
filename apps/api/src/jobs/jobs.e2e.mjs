import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { zipSync, strToU8 } from 'fflate';

const base = process.env.WORK_API_URL ?? 'http://localhost:3101';
const origin = process.env.TEST_FRONTEND_ORIGIN ?? 'http://localhost:3100';
const ids = [];

async function create(tool, headers = {}) {
  const response = await fetch(`${base}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin, ...headers },
    body: JSON.stringify({ tool, options: {} }),
  });
  const body = await response.json();
  if (response.ok) ids.push(body.id);
  return { response, body };
}

async function convert(tool, name, bytes) {
  const { response, body } = await create(tool);
  assert.equal(response.status, 201, JSON.stringify(body));
  const form = new FormData();
  form.append('file', new Blob([bytes]), name);
  const uploaded = await fetch(`${base}/jobs/${body.id}/files`, {
    method: 'POST',
    body: form,
  });
  assert.equal(uploaded.status, 201, await uploaded.text());
  const started = await fetch(`${base}/jobs/${body.id}/start`, {
    method: 'POST',
  });
  assert.equal(started.status, 201);
  const deadline = Date.now() + 25_000;
  let state;
  do {
    state = await (await fetch(`${base}/jobs/${body.id}`)).json();
    assert.notEqual(state.state, 'failed', state.message);
    if (state.state === 'completed') break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  } while (Date.now() < deadline);
  assert.equal(state.state, 'completed', JSON.stringify(state));
  const result = await fetch(`${base}/jobs/${body.id}/download`);
  assert.equal(result.status, 200);
  const output = Buffer.from(await result.arrayBuffer());
  assert.equal((await PDFDocument.load(output)).getPageCount(), 1);
  // 전송이 끝난 뒤 입력과 결과가 함께 남아 있지 않은지 API 경계에서 확인한다.
  for (let attempt = 0; attempt < 20; attempt++) {
    if ((await fetch(`${base}/jobs/${body.id}`)).status === 404) return output;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.fail('다운로드한 결과의 삭제를 확인하지 못했습니다.');
}

try {
  const health = await fetch(`${base}/health`, { headers: { Origin: origin } });
  assert.equal(health.status, 200);
  assert.equal(health.headers.get('access-control-allow-origin'), origin);

  // 작은 고해상도 그림 한 장만 넣어 Ghostscript의 실제 축소를 확인한다.
  const pixels = Buffer.alloc(384 * 384 * 3);
  let seed = 12345;
  for (let index = 0; index < pixels.length; index++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    pixels[index] = seed >>> 24;
  }
  const png = await sharp(pixels, {
    raw: { width: 384, height: 384, channels: 3 },
  })
    .png()
    .toBuffer();
  const document = await PDFDocument.create();
  const image = await document.embedPng(png);
  document
    .addPage([72, 72])
    .drawImage(image, { x: 0, y: 0, width: 72, height: 72 });
  const pdf = Buffer.from(await document.save());
  const compressed = await convert('pdf-compress', 'small.pdf', pdf);
  assert(
    compressed.length < pdf.length,
    '실제 PDF 압축 결과가 줄지 않았습니다.'
  );
  console.log(
    `실제 PDF 압축·다운로드·삭제 통과: ${pdf.length}B → ${compressed.length}B`
  );

  const entries = {
    '[Content_Types].xml':
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    '_rels/.rels':
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    'word/document.xml':
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>작은 문서 변환 확인</w:t></w:r></w:p><w:sectPr/></w:body></w:document>',
  };
  const docx = Buffer.from(
    zipSync(
      Object.fromEntries(
        Object.entries(entries).map(([name, value]) => [name, strToU8(value)])
      )
    )
  );
  await convert('document-to-pdf', 'small.docx', docx);
  console.log('실제 DOCX 변환·다운로드·삭제 통과');

  // 서로 다른 두 실제 IP를 전달해 제한이 중계 IP 하나로 합쳐지지 않는지 확인한다.
  const suffix = randomBytes(10).toString('hex').match(/.{4}/g).join(':');
  const firstIp = `2001:db8:1:${suffix}`;
  const secondIp = `2001:db8:2:${suffix}`;
  for (let attempt = 0; attempt < 10; attempt++) {
    const { response } = await create('document-to-pdf', {
      'CF-Connecting-IP': firstIp,
    });
    assert.equal(response.status, 201);
  }
  const blocked = await create('document-to-pdf', {
    'CF-Connecting-IP': firstIp,
    'X-Forwarded-For': '203.0.113.199',
  });
  assert.equal(
    blocked.response.status,
    429,
    '임의 전달 헤더로 요청 제한을 우회했습니다.'
  );
  const other = await create('document-to-pdf', {
    'CF-Connecting-IP': secondIp,
  });
  assert.equal(
    other.response.status,
    201,
    '서로 다른 사용자가 같은 요청 제한을 공유합니다.'
  );
  console.log('사용자 IP별 요청 제한과 전달 헤더 위조 방지 통과');
} finally {
  await Promise.all(
    ids.map((id) =>
      fetch(`${base}/jobs/${id}`, { method: 'DELETE' }).catch(() => {})
    )
  );
}
