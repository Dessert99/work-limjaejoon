/** 정적 도구 목록과 기존 모델의 도구 식별자를 실제 화면 주소에 연결한다. */
export const toolRoutes = [
  {
    modelId: 'image-converter',
    href: '/image-compressor/',
    label: '이미지 용량 줄이기',
    description: 'JPG·PNG·WebP 한 장을 브라우저에서 압축합니다.',
  },
  {
    modelId: null,
    href: '/image-converter/',
    label: '이미지 확장자 변환',
    description: 'JPG·PNG·WebP 형식을 바꾸고 크기를 조절합니다.',
  },
  {
    modelId: 'photos-to-pdf',
    href: '/images-to-pdf/',
    label: '사진을 PDF로',
    description: '여러 사진의 순서를 정하고 PDF 하나로 묶습니다.',
  },
  {
    modelId: 'pdf',
    href: '/pdf-edit/',
    label: 'PDF 페이지 편집',
    description: '페이지 순서를 바꾸고 회전하거나 삭제합니다.',
  },
  {
    modelId: null,
    href: '/pdf-merge/',
    label: 'PDF 합치기',
    description: '여러 PDF를 선택한 순서대로 합칩니다.',
  },
  {
    modelId: null,
    href: '/pdf-split/',
    label: 'PDF 나누기',
    description: '페이지 범위를 골라 추출하거나 나눕니다.',
  },
  {
    modelId: 'character-counter',
    href: '/character-counter/',
    label: '글자 수 세기',
    description: '공백 포함·제외 글자 수와 바이트 수를 확인합니다.',
  },
  {
    modelId: 'pdf-compressor',
    href: '/pdf-compressor/',
    label: 'PDF 용량 줄이기',
    description: '스캔본과 이미지가 많은 PDF를 압축합니다.',
  },
  {
    modelId: 'document-to-pdf',
    href: '/document-to-pdf/',
    label: '문서를 PDF로',
    description: 'DOCX·PPTX와 실험 지원하는 HWP·HWPX를 PDF로 변환합니다.',
  },
] as const;

/** 지원하는 자산 식별자만 이동 가능한 도구로 취급한다. */
export function findToolRoute(modelId: unknown) {
  return typeof modelId === 'string'
    ? toolRoutes.find((tool) => tool.modelId === modelId)
    : undefined;
}
