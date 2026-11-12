import { BadRequestException } from '@nestjs/common';
import { unzipSync } from 'fflate';
import type { Tool } from '../file-tools/processing';
import { validateHwpHeader } from '../file-tools/hwp-header';

/** 확장자와 브라우저 MIME 대신 파일 헤더와 컨테이너 구조로 입력을 구분한다. */
export function validateFile(bytes: Buffer, tool: Tool): string {
  if (!bytes.length)
    throw new BadRequestException('빈 파일은 처리할 수 없습니다.');
  let kind = '';
  if (bytes.subarray(0, 5).toString() === '%PDF-') kind = 'application/pdf';
  else if (
    bytes
      .subarray(0, 8)
      .equals(Buffer.from([208, 207, 17, 224, 161, 177, 26, 225]))
  ) {
    validateHwpHeader(bytes);
    kind = 'application/x-hwp';
  } else if (bytes.subarray(0, 4).equals(Buffer.from([80, 75, 3, 4]))) {
    const names = new Set<string>();
    let expanded = 0;
    let count = 0;
    try {
      // 이름만 검사해 압축 폭탄을 검증 과정에서 해제하지 않는다.
      unzipSync(bytes, {
        filter: (entry) => {
          expanded += entry.originalSize;
          count++;
          names.add(entry.name);
          if (expanded > 300_000_000 || count > 10_000)
            throw new Error('문서의 압축 해제 크기 상한을 초과했습니다.');
          return false;
        },
      });
    } catch {
      throw new BadRequestException('손상된 문서 파일입니다.');
    }
    if (
      names.has('Contents/header.xml') &&
      names.has('Contents/section0.xml') &&
      names.has('Contents/content.hpf')
    ) {
      const mime = unzipSync(bytes, {
        filter: (entry) => {
          if (entry.name !== 'mimetype') return false;
          if (entry.originalSize > 100)
            throw new BadRequestException(
              'HWPX 형식 정보가 올바르지 않습니다.'
            );
          return true;
        },
      }).mimetype;
      if (
        !mime ||
        Buffer.from(mime).toString('utf8').trim() !== 'application/hwp+zip'
      )
        throw new BadRequestException('HWPX 형식 정보가 올바르지 않습니다.');
      kind = 'application/hwp+zip';
    } else if (
      names.has('[Content_Types].xml') &&
      names.has('word/document.xml')
    )
      kind =
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (
      names.has('[Content_Types].xml') &&
      names.has('ppt/presentation.xml')
    )
      kind =
        'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  }
  const accepted =
    tool === 'document-to-pdf'
      ? kind.includes('openxmlformats') ||
        ['application/x-hwp', 'application/hwp+zip'].includes(kind)
      : kind === 'application/pdf';
  if (!accepted)
    throw new BadRequestException(
      '이 도구에서 지원하지 않거나 손상된 파일입니다.'
    );
  return kind;
}
