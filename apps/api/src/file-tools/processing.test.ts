import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PDFDocument } from 'pdf-lib';
import { processFiles, type InputFile } from './processing';
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
