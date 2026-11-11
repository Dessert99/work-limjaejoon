import { BadRequestException } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';

/** 암호 PDF와 잘못된 파일을 처리 경계에서 거부한다. */
export async function loadPdf(path: string) {
  try {
    const document = await PDFDocument.load(await readFile(path), {
      updateMetadata: false,
    });
    if (document.isEncrypted) throw new Error();
    return document;
  } catch {
    throw new BadRequestException(
      '암호가 있거나 손상된 PDF는 처리할 수 없습니다.'
    );
  }
}

/** 페이지 범위를 검증하면서 입력한 순서와 중복을 보존한다. */
export function parsePageRange(range: string, total: number): number[] {
  if (!range.trim() || range.length > 10_000)
    throw new BadRequestException('페이지 범위를 입력해 주세요.');
  const pages: number[] = [];
  for (const token of range.split(',')) {
    const match = /^(\d+)\s*(?:-\s*(\d+))?$/.exec(token.trim());
    if (!match)
      throw new BadRequestException('페이지 범위는 3-5, 8처럼 입력해 주세요.');
    const start = Number(match[1]);
    const end = Number(match[2] ?? start);
    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      start < 1 ||
      end < start ||
      end > total
    )
      throw new BadRequestException(
        'PDF에 존재하는 페이지 범위를 입력해 주세요.'
      );
    // 과도한 복제로 메모리가 증가하지 않도록 결과 페이지 수를 제한한다.
    if (pages.length + end - start + 1 > 10_000)
      throw new BadRequestException(
        '한 결과는 10,000페이지를 넘길 수 없습니다.'
      );
    for (let page = start; page <= end; page++) pages.push(page - 1);
  }
  return pages;
}
