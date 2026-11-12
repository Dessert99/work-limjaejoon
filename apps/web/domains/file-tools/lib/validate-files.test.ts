import { describe, expect, it } from 'vitest';
import { validateFiles } from './validate-files';

const file = (name: string, size = 100) => ({ name, size });

describe('서버 파일 도구의 업로드 경계', () => {
  it('PDF 편집과 변환 도구의 형식 및 개수 제한을 적용한다', () => {
    expect(() =>
      validateFiles(
        'pdf-edit',
        Array.from({ length: 20 }, () => file('문서.PDF'))
      )
    ).not.toThrow();
    expect(() =>
      validateFiles(
        'pdf-edit',
        Array.from({ length: 21 }, () => file('문서.pdf'))
      )
    ).toThrow();
    for (const tool of ['pdf-compress', 'document-to-pdf'] as const) {
      const name = tool === 'pdf-compress' ? '문서.pdf' : '문서.docx';
      expect(() =>
        validateFiles(
          tool,
          Array.from({ length: 3 }, () => file(name))
        )
      ).not.toThrow();
      expect(() =>
        validateFiles(
          tool,
          Array.from({ length: 4 }, () => file(name))
        )
      ).toThrow();
    }
    expect(() => validateFiles('pdf-compress', [file('사진.png')])).toThrow();
  });
  it('빈 파일과 파일당 또는 합계 크기 초과는 요청 전에 거절한다', () => {
    expect(() => validateFiles('pdf-edit', [file('빈.pdf', 0)])).toThrow();
    expect(() =>
      validateFiles('pdf-edit', [file('큰.pdf', 90_000_001)])
    ).toThrow();
    expect(() =>
      validateFiles(
        'pdf-edit',
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
