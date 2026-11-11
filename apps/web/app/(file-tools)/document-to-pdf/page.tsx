import type { Metadata } from 'next';
import FileToolPage from '../_components/FileToolPage';

/** 도구 상세 페이지의 검색 정보를 정적 HTML로 제공한다. */
export const metadata: Metadata = {
  title: '문서를 PDF로',
  description: 'DOCX·PPTX 문서를 제출용 PDF로 변환하세요.',
  alternates: { canonical: 'https://work.limjaejoon.com/document-to-pdf/' },
  robots: { index: true, follow: true },
};

/** 파일 처리 상호작용만 클라이언트 경계로 분리한다. */
export default function Page() {
  return <FileToolPage tool='document-to-pdf' />;
}
