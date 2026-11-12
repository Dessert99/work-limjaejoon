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
