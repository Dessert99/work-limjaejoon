import { describe, expect, it } from 'vitest';
import { validateFiles } from './validate-files';

const file = (name: string, size = 100) => ({ name, size });

describe('서버 파일 도구의 업로드 경계', () => {
  it('사진과 PDF 도구의 서로 다른 형식 및 개수 제한을 적용한다', () => {
    expect(() =>
      validateFiles(
        'images-to-pdf',
        Array.from({ length: 50 }, () => file('사진.PNG'))
      )
    ).not.toThrow();
    expect(() =>
      validateFiles(
        'images-to-pdf',
        Array.from({ length: 51 }, () => file('사진.png'))
      )
    ).toThrow();
    expect(() =>
      validateFiles(
        'pdf-merge',
        Array.from({ length: 21 }, () => file('문서.pdf'))
      )
    ).toThrow();
    expect(() =>
      validateFiles('pdf-split', [file('하나.pdf'), file('둘.pdf')])
    ).toThrow();
    expect(() => validateFiles('pdf-compress', [file('사진.png')])).toThrow();
  });
  it('빈 파일과 파일당 또는 합계 크기 초과는 요청 전에 거절한다', () => {
    expect(() => validateFiles('pdf-merge', [file('빈.pdf', 0)])).toThrow();
    expect(() =>
      validateFiles('pdf-merge', [file('큰.pdf', 90_000_001)])
    ).toThrow();
    expect(() =>
      validateFiles(
        'pdf-merge',
        Array.from({ length: 4 }, () => file('문서.pdf', 80_000_000))
      )
    ).toThrow();
    expect(() =>
      validateFiles('document-to-pdf', [file('과제.docx', 90_000_000)])
    ).not.toThrow();
    expect(() =>
      validateFiles('document-to-pdf', [file('과제.HWP'), file('과제.hwpx')])
    ).not.toThrow();
    expect(() =>
      validateFiles('document-to-pdf', [file('과제.doc')])
    ).toThrow();
  });
});
