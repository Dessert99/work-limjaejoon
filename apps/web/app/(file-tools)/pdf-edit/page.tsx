import type { Metadata } from 'next';
import FileToolPage from '../_components/FileToolPage';

/** 도구 상세 페이지의 검색 정보를 정적 HTML로 제공한다. */
export const metadata: Metadata = {
  title: 'PDF 페이지 편집',
  description: 'PDF 페이지의 순서를 바꾸고 회전하거나 삭제하세요.',
  alternates: { canonical: 'https://work.limjaejoon.com/pdf-edit/' },
  robots: { index: true, follow: true },
};

/** 파일 처리 상호작용만 클라이언트 경계로 분리한다. */
export default function Page() {
  return <FileToolPage tool='pdf-edit' />;
}
