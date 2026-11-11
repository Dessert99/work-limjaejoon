import type { FileTool } from '../model/file-tools';

/** 도구마다 입력 제한과 검색용 설명을 같은 기준으로 제공한다. */
export const fileTools = {
  'images-to-pdf': {
    path: 'images-to-pdf',
    title: '사진 여러 장을 PDF로',
    description:
      'JPG·PNG·WebP 사진의 순서와 용지 크기를 정해 PDF 하나로 묶으세요.',
    instructions:
      '사진을 선택한 뒤 끌어서 순서를 바꾸세요. 용지 크기와 여백을 정하고 PDF 만들기를 누르세요.',
    action: 'PDF 만들기',
    accept: '.jpg,.jpeg,.png,.webp',
    extensions: ['jpg', 'jpeg', 'png', 'webp'],
    maxFiles: 50,
  },
  'pdf-merge': {
    path: 'pdf-merge',
    title: 'PDF 합치기',
    description:
      '여러 PDF를 원하는 순서대로 하나로 합치세요. 페이지 내용을 다시 압축하지 않습니다.',
    instructions:
      'PDF를 최대 20개 선택하고 파일을 끌어서 순서를 정한 뒤 합치기를 누르세요.',
    action: 'PDF 합치기',
    accept: '.pdf',
    extensions: ['pdf'],
    maxFiles: 20,
  },
  'pdf-split': {
    path: 'pdf-split',
    title: 'PDF 나누기',
    description:
      'PDF에서 필요한 페이지 범위를 추출하세요. 여러 결과는 ZIP으로 받습니다.',
    instructions:
      'PDF를 선택하고 3-5, 8처럼 페이지 범위를 입력하세요. 줄마다 별도의 결과 파일을 만듭니다.',
    action: '페이지 추출하기',
    accept: '.pdf',
    extensions: ['pdf'],
    maxFiles: 1,
  },
  'pdf-edit': {
    path: 'pdf-edit',
    title: 'PDF 페이지 편집',
    description:
      'PDF 페이지를 미리 보고 순서를 바꾸거나 회전하고 필요 없는 페이지를 지우세요.',
    instructions:
      'PDF를 선택한 뒤 페이지별 이동, 회전, 삭제 버튼으로 편집하고 PDF 저장을 누르세요.',
    action: 'PDF 저장',
    accept: '.pdf',
    extensions: ['pdf'],
    maxFiles: 20,
  },
  'pdf-compress': {
    path: 'pdf-compressor',
    title: 'PDF 용량 줄이기',
    description:
      '스캔본과 이미지가 많은 PDF를 압축하고 실제 결과 용량을 확인하세요.',
    instructions:
      'PDF를 최대 3개 선택하고 압축하기를 누르세요. 용량이 줄지 않으면 원본을 돌려드립니다.',
    action: 'PDF 압축하기',
    accept: '.pdf',
    extensions: ['pdf'],
    maxFiles: 3,
  },
  'document-to-pdf': {
    path: 'document-to-pdf',
    title: '문서를 PDF로',
    description:
      'DOCX·PPTX 문서를 PDF로 변환하세요. HWP·HWPX는 실험 기능으로 제공합니다.',
    instructions:
      '문서를 최대 3개 선택하고 변환하기를 누르세요. 변환 후 글꼴과 배치를 확인하세요.',
    action: 'PDF로 변환하기',
    accept: '.docx,.pptx,.hwp,.hwpx',
    extensions: ['docx', 'pptx', 'hwp', 'hwpx'],
    maxFiles: 3,
  },
} satisfies Record<
  FileTool,
  {
    path: string;
    title: string;
    description: string;
    instructions: string;
    action: string;
    accept: string;
    extensions: readonly string[];
    maxFiles: number;
  }
>;
