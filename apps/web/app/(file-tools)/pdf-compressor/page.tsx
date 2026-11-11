import type { Metadata } from 'next';
import FileToolPage from '../_components/FileToolPage';

/** 도구 상세 페이지의 검색 정보를 정적 HTML로 제공한다. */
export const metadata: Metadata = {
  title: 'PDF 용량 줄이기',
  description: '스캔 PDF를 압축하고 전후 파일 크기를 비교하세요.',
  alternates: { canonical: 'https://work.limjaejoon.com/pdf-compressor/' },
  robots: { index: true, follow: true },
};

/** 파일 처리 상호작용만 클라이언트 경계로 분리한다. */
export default function Page() {
  return <FileToolPage tool='pdf-compress' />;
}
