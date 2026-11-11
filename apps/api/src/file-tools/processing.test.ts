import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PDFDocument } from 'pdf-lib';
import { unzipSync } from 'fflate';
import sharp from 'sharp';
import { processFiles, type InputFile } from './processing';
import { parsePageRange } from './pdf';
import { runCommand } from './process-command';

vi.mock('./process-command', () => ({ runCommand: vi.fn() }));
const directories: string[] = [];
afterEach(async () => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true }))
  );
});
async function workspace() {
  const directory = await mkdtemp(join(tmpdir(), 'file-tools-unit-'));
  directories.push(directory);
  return directory;
}
async function pdf(
  directory: string,
  sizes: number[],
  name = 'input.pdf'
): Promise<InputFile> {
  const document = await PDFDocument.create();
  sizes.forEach((size) => document.addPage([size, size]));
  const bytes = await document.save();
  const path = join(directory, name);
  await writeFile(path, bytes);
  return { path, name, size: bytes.length, kind: 'application/pdf' };
}

describe('서버 파일 처리', () => {
  it('사진 PDF: 작은 PNG를 A4 한 장에 넣고 잘못된 여백을 거부한다', async () => {
    const directory = await workspace();
    const bytes = await sharp({
      create: { width: 1, height: 1, channels: 3, background: '#fff' },
    })
      .png()
      .toBuffer();
    const path = join(directory, 'input.png');
    await writeFile(path, bytes);
    const file = {
      path,
      name: 'input.png',
      size: bytes.length,
      kind: 'image/png',
    };
    const result = await processFiles(
      'images-to-pdf',
      [file],
      { pageSize: 'a4', margin: 20 },
      directory
    );
    const document = await PDFDocument.load(await readFile(result.path));
    expect(document.getPageCount()).toBe(1);
    expect(document.getPage(0).getWidth()).toBeCloseTo(595.28);
    await expect(
      processFiles('images-to-pdf', [file], { margin: -1 }, directory)
    ).rejects.toThrow('설정');
  });

  it('PDF 합치기: 파일 순서대로 페이지를 보존한다', async () => {
    const directory = await workspace();
    const files = [
      await pdf(directory, [100], 'a.pdf'),
      await pdf(directory, [200], 'b.pdf'),
    ];
    const result = await processFiles('pdf-merge', files, {}, directory);
    const merged = await PDFDocument.load(await readFile(result.path));
    expect(merged.getPages().map((page) => page.getWidth())).toEqual([
      100, 200,
    ]);
  });

  it('PDF 나누기: 범위별 ZIP을 만들고 잘못된 범위를 거부한다', async () => {
    const directory = await workspace();
    const file = await pdf(directory, [100, 200, 300]);
    const result = await processFiles(
      'pdf-split',
      [file],
      { ranges: ['3, 1', '2'] },
      directory
    );
    const entries = unzipSync(await readFile(result.path));
    const first = await PDFDocument.load(Object.values(entries)[0]);
    expect(first.getPages().map((page) => page.getWidth())).toEqual([300, 100]);
    expect(Object.keys(entries)).toHaveLength(2);
    expect(() => parsePageRange('0-2', 3)).toThrow();
    expect(() => parsePageRange('1-999999999', 3)).toThrow();
  });

  it('PDF 편집: 선택 순서와 상대 회전을 적용하고 범위 밖 페이지를 거부한다', async () => {
    const directory = await workspace();
    const file = await pdf(directory, [100, 200]);
    const result = await processFiles(
      'pdf-edit',
      [file],
      { pages: [{ file: 0, page: 2, rotation: 90 }] },
      directory
    );
    const edited = await PDFDocument.load(await readFile(result.path));
    expect(edited.getPageCount()).toBe(1);
    expect(edited.getPage(0).getWidth()).toBe(200);
    expect(edited.getPage(0).getRotation().angle).toBe(90);
    await expect(
      processFiles(
        'pdf-edit',
        [file],
        { pages: [{ file: 0, page: 3, rotation: 0 }] },
        directory
      )
    ).rejects.toThrow();
  });

  it('PDF 압축: 외부 명령 결과가 커지면 원본 바이트를 그대로 돌려준다', async () => {
    const directory = await workspace();
    const file = await pdf(directory, [100]);
    vi.mocked(runCommand).mockImplementation(async (_command, args) => {
      const path = args
        .find((arg) => arg.startsWith('-sOutputFile='))!
        .slice('-sOutputFile='.length);
      await writeFile(path, Buffer.alloc(file.size + 1));
    });
    const result = await processFiles('pdf-compress', [file], {}, directory);
    expect(result.originalReturned).toBe(true);
    expect(await readFile(result.path)).toEqual(await readFile(file.path));
    expect(vi.mocked(runCommand).mock.calls[0][1]).toContain('-dSAFER');
  });

  it('한글 문서 PDF: 실험 설정과 확장을 확인하고 전용 필터를 사용한다', async () => {
    const directory = await workspace();
    const source = await pdf(directory, [100]);
    const marker = join(directory, 'h2orestart-installed');
    await writeFile(marker, '0.8.0');
    vi.stubEnv('H2ORESTART_MARKER_PATH', marker);
    const file = { ...source, kind: 'application/x-hwp' };
    vi.stubEnv('HWP_EXPERIMENTAL_ENABLED', '0');
    await expect(
      processFiles('document-to-pdf', [file], {}, directory)
    ).rejects.toThrow('실험 변환');
    vi.stubEnv('HWP_EXPERIMENTAL_ENABLED', '1');
    vi.mocked(runCommand).mockImplementation(async (_command, args, work) => {
      expect(args).toContain('--infilter=Hwp2002_Reader');
      expect(args).toContain('pdf:writer_pdf_Export');
      await writeFile(join(work, 'input.pdf'), await readFile(source.path));
    });
    const result = await processFiles('document-to-pdf', [file], {}, directory);
    expect(
      (await PDFDocument.load(await readFile(result.path))).getPageCount()
    ).toBe(1);
    vi.stubEnv('H2ORESTART_MARKER_PATH', join(directory, 'missing'));
    await expect(
      processFiles(
        'document-to-pdf',
        [{ ...file, kind: 'application/hwp+zip' }],
        {},
        directory
      )
    ).rejects.toThrow('H2Orestart');
  });

  it('문서 PDF: 별도 프로필로 변환하고 결과 PDF를 검증한다', async () => {
    const directory = await workspace();
    const source = await pdf(directory, [100]);
    const file = {
      ...source,
      kind: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      name: '../../input.docx',
    };
    vi.mocked(runCommand).mockImplementation(async (_command, args, work) => {
      await mkdir(join(work, 'profile'), { recursive: true });
      await writeFile(join(work, 'input.pdf'), await readFile(source.path));
      expect(args[0]).toContain('-env:UserInstallation=file:');
    });
    const result = await processFiles('document-to-pdf', [file], {}, directory);
    expect(result.path.startsWith(directory)).toBe(true);
    expect(
      (await PDFDocument.load(await readFile(result.path))).getPageCount()
    ).toBe(1);
  });
});
