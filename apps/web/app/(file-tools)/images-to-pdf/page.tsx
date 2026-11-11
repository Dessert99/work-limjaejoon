import type { Metadata } from 'next';
import FileToolPage from '../_components/FileToolPage';

/** 도구 상세 페이지의 검색 정보를 정적 HTML로 제공한다. */
export const metadata: Metadata = {
  title: '사진 여러 장을 PDF로',
  description: 'JPG·PNG·WebP 사진을 원하는 순서대로 PDF 하나로 묶으세요.',
  alternates: { canonical: 'https://work.limjaejoon.com/images-to-pdf/' },
  robots: { index: true, follow: true },
};

/** 파일 처리 상호작용만 클라이언트 경계로 분리한다. */
export default function Page() {
  return <FileToolPage tool='images-to-pdf' />;
}
