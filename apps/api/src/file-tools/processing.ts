import {
  BadRequestException,
  UnprocessableEntityException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  access,
  readFile,
  writeFile,
  copyFile,
  mkdir,
  stat,
} from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PDFDocument, PageSizes, degrees } from 'pdf-lib';
import sharp from 'sharp';
import { zipSync } from 'fflate';
import { loadPdf, parsePageRange } from './pdf';
import { runCommand } from './process-command';

/** 검증을 통과한 업로드 파일의 처리 정보다. */
export type InputFile = {
  path: string;
  name: string;
  size: number;
  kind: string;
};
/** 서버에서 실행할 파일 도구를 구분한다. */
export type Tool =
  | 'images-to-pdf'
  | 'pdf-merge'
  | 'pdf-split'
  | 'pdf-edit'
  | 'pdf-compress'
  | 'document-to-pdf';

type Output = { path: string; name: string; originalReturned?: boolean };

function optionsObject(value: unknown, allowed: string[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new BadRequestException('처리 설정이 올바르지 않습니다.');
  const options = value as Record<string, unknown>;
  if (Object.keys(options).some((key) => !allowed.includes(key)))
    throw new BadRequestException('지원하지 않는 처리 설정입니다.');
  return options;
}

async function savePdf(document: PDFDocument, path: string) {
  await writeFile(path, await document.save());
}

async function imagesToPdf(
  files: InputFile[],
  value: unknown,
  directory: string
): Promise<Output> {
  const options = optionsObject(value, [
    'pageSize',
    'margin',
    'compressImages',
  ]);
  const { pageSize = 'a4', margin = 0, compressImages = false } = options;
  if (
    !['a4', 'image'].includes(String(pageSize)) ||
    typeof margin !== 'number' ||
    !Number.isFinite(margin) ||
    margin < 0 ||
    margin > 100 ||
    typeof compressImages !== 'boolean'
  )
    throw new BadRequestException(
      '용지 크기, 여백 또는 압축 설정이 올바르지 않습니다.'
    );
  const document = await PDFDocument.create();
  for (const file of files) {
    const input = sharp(file.path, {
      limitInputPixels: 24_000_000,
      failOn: 'error',
    });
    const metadata = await input.metadata();
    if (
      !metadata.width ||
      !metadata.height ||
      !['jpeg', 'png', 'webp'].includes(metadata.format ?? '') ||
      (metadata.pages ?? 1) > 1
    )
      throw new BadRequestException(
        '정지된 JPG, PNG, WebP 이미지만 사용할 수 있습니다.'
      );
    // JPG는 명시적으로 압축을 고른 경우에만 다시 인코딩한다.
    const image = compressImages
      ? await document.embedJpg(
          await input
            .flatten({ background: '#fff' })
            .jpeg({ quality: 80 })
            .toBuffer()
        )
      : metadata.format === 'jpeg'
        ? await document.embedJpg(await readFile(file.path))
        : await document.embedPng(await input.png().toBuffer());
    const [width, height] =
      pageSize === 'a4'
        ? PageSizes.A4
        : [image.width + margin * 2, image.height + margin * 2];
    const scale = Math.min(
      (width - margin * 2) / image.width,
      (height - margin * 2) / image.height
    );
    const page = document.addPage([width, height]);
    page.drawImage(image, {
      x: (width - image.width * scale) / 2,
      y: (height - image.height * scale) / 2,
      width: image.width * scale,
      height: image.height * scale,
    });
  }
  const path = join(directory, 'images.pdf');
  await savePdf(document, path);
  return { path, name: 'images.pdf' };
}

async function editPdf(
  tool: Tool,
  files: InputFile[],
  value: unknown,
  directory: string
): Promise<Output> {
  const documents: PDFDocument[] = [];
  for (const file of files) documents.push(await loadPdf(file.path));
  if (tool === 'pdf-split') {
    const { ranges } = optionsObject(value, ['ranges']);
    if (
      !Array.isArray(ranges) ||
      !ranges.length ||
      ranges.length > 100 ||
      ranges.some((range) => typeof range !== 'string')
    )
      throw new BadRequestException(
        '나눌 페이지 범위를 1개에서 100개까지 입력해 주세요.'
      );
    const selections = ranges.map((range) =>
      parsePageRange(range, documents[0].getPageCount())
    );
    if (selections.reduce((total, pages) => total + pages.length, 0) > 10_000)
      throw new BadRequestException(
        '전체 결과는 10,000페이지를 넘길 수 없습니다.'
      );
    const outputs: Output[] = [];
    for (const [index, selection] of selections.entries()) {
      const document = await PDFDocument.create();
      const pages = await document.copyPages(documents[0], selection);
      pages.forEach((page) => document.addPage(page));
      const name = `split-${index + 1}.pdf`;
      const path = join(directory, name);
      await savePdf(document, path);
      outputs.push({ path, name });
    }
    return packageOutputs(outputs, directory);
  }
  const document = await PDFDocument.create();
  if (tool === 'pdf-merge') {
    optionsObject(value, []);
    for (const source of documents) {
      const pages = await document.copyPages(source, source.getPageIndices());
      pages.forEach((page) => document.addPage(page));
    }
  } else {
    const { pages } = optionsObject(value, ['pages']);
    if (!Array.isArray(pages) || !pages.length || pages.length > 10_000)
      throw new BadRequestException('결과에 포함할 페이지를 선택해 주세요.');
    for (const selection of pages) {
      const { file, page, rotation } = optionsObject(selection, [
        'file',
        'page',
        'rotation',
      ]);
      if (
        typeof file !== 'number' ||
        !Number.isInteger(file) ||
        !documents[file] ||
        typeof page !== 'number' ||
        !Number.isInteger(page) ||
        page < 1 ||
        page > documents[file].getPageCount() ||
        typeof rotation !== 'number' ||
        ![0, 90, 180, 270].includes(rotation)
      )
        throw new BadRequestException(
          '페이지 선택 또는 회전 설정이 올바르지 않습니다.'
        );
      const [copied] = await document.copyPages(documents[file], [page - 1]);
      copied.setRotation(
        degrees((copied.getRotation().angle + rotation) % 360)
      );
      document.addPage(copied);
    }
  }
  const name = tool === 'pdf-merge' ? 'merged.pdf' : 'edited.pdf';
  const path = join(directory, name);
  await savePdf(document, path);
  return { path, name };
}

async function packageOutputs(
  outputs: Output[],
  directory: string
): Promise<Output> {
  if (outputs.length === 1) return outputs[0];
  const entries: Record<string, Uint8Array> = {};
  for (const [index, output] of outputs.entries())
    entries[`${index + 1}-${output.name}`] = await readFile(output.path);
  const path = join(directory, 'results.zip');
  // PDF는 이미 압축된 스트림이어서 ZIP에서 재압축하지 않는다.
  await writeFile(path, zipSync(entries, { level: 0 }));
  return {
    path,
    name: 'results.zip',
    originalReturned: outputs.some((output) => output.originalReturned),
  };
}

async function compressPdfs(
  files: InputFile[],
  value: unknown,
  directory: string
) {
  optionsObject(value, []);
  const outputs: Output[] = [];
  for (const [index, file] of files.entries()) {
    await loadPdf(file.path);
    const path = join(directory, `compressed-${index + 1}.pdf`);
    await runCommand(
      'gs',
      [
        '-dSAFER',
        '-dBATCH',
        '-dNOPAUSE',
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.6',
        '-dPDFSETTINGS=/ebook',
        '-dNumRenderingThreads=1',
        `-sOutputFile=${path}`,
        '-f',
        file.path,
      ],
      directory
    );
    const result = await stat(path);
    if (!result.size)
      throw new UnprocessableEntityException('압축된 PDF가 비어 있습니다.');
    const originalReturned = result.size >= file.size;
    if (originalReturned) await copyFile(file.path, path);
    outputs.push({
      path,
      name: `compressed-${index + 1}.pdf`,
      originalReturned,
    });
  }
  return packageOutputs(outputs, directory);
}

async function convertDocuments(
  files: InputFile[],
  value: unknown,
  directory: string
) {
  optionsObject(value, []);
  const outputs: Output[] = [];
  const extensions: Record<string, string> = {
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      'docx',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      'pptx',
    'application/x-hwp': 'hwp',
    'application/hwp+zip': 'hwpx',
  };
  for (const [index, file] of files.entries()) {
    const extension = extensions[file.kind];
    if (!extension)
      throw new BadRequestException('DOCX, PPTX, HWP, HWPX 문서만 지원합니다.');
    const experimental = extension === 'hwp' || extension === 'hwpx';
    if (experimental) {
      try {
        if (process.env.HWP_EXPERIMENTAL_ENABLED !== '1') throw new Error();
        await access(
          process.env.H2ORESTART_MARKER_PATH ??
            '/usr/local/share/h2orestart/installed'
        );
      } catch {
        throw new ServiceUnavailableException(
          '서버에서 HWP·HWPX 실험 변환을 사용하도록 설정하고 H2Orestart를 설치해야 합니다.'
        );
      }
    }
    const work = join(directory, `document-${index + 1}`);
    await mkdir(work);
    const input = join(work, `input.${extension}`);
    await copyFile(file.path, input);
    const profile = pathToFileURL(join(work, 'profile')).href;
    await runCommand(
      'libreoffice',
      [
        `-env:UserInstallation=${profile}`,
        '--headless',
        '--nologo',
        '--nodefault',
        '--nolockcheck',
        '--nofirststartwizard',
        ...(experimental ? ['--infilter=Hwp2002_Reader'] : []),
        '--convert-to',
        experimental ? 'pdf:writer_pdf_Export' : 'pdf',
        '--outdir',
        work,
        input,
      ],
      work
    );
    const path = join(work, 'input.pdf');
    await loadPdf(path);
    outputs.push({ path, name: `document-${index + 1}.pdf` });
  }
  return packageOutputs(outputs, directory);
}

/** 파일 종류와 옵션을 검증한 뒤 서버 도구의 실제 결과를 만든다. */
export async function processFiles(
  tool: Tool,
  files: InputFile[],
  options: unknown,
  directory: string
): Promise<Output> {
  const limits: Record<Tool, number> = {
    'images-to-pdf': 50,
    'pdf-merge': 20,
    'pdf-split': 1,
    'pdf-edit': 20,
    'pdf-compress': 3,
    'document-to-pdf': 3,
  };
  if (
    !Object.hasOwn(limits, tool) ||
    !files.length ||
    files.length > limits[tool] ||
    files.some(
      (file) =>
        !Number.isSafeInteger(file.size) ||
        file.size <= 0 ||
        file.size > 90_000_000
    ) ||
    files.reduce((size, file) => size + file.size, 0) > 300_000_000
  )
    throw new BadRequestException('파일 개수 또는 용량 상한을 초과했습니다.');
  if (tool === 'images-to-pdf') {
    if (
      files.some(
        (file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.kind)
      )
    )
      throw new BadRequestException(
        'JPG, PNG, WebP 이미지만 사용할 수 있습니다.'
      );
    return imagesToPdf(files, options, directory);
  }
  if (tool === 'document-to-pdf')
    return convertDocuments(files, options, directory);
  if (files.some((file) => file.kind !== 'application/pdf'))
    throw new BadRequestException('PDF 파일만 사용할 수 있습니다.');
  if (tool === 'pdf-compress') return compressPdfs(files, options, directory);
  return editPdf(tool, files, options, directory);
}
