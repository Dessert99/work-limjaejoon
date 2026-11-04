import type { Metadata } from 'next';
import BagBackLink from './_components/BagBackLink';
import ImageWorkspace from './_components/ImageWorkspace';
import * as styles from './_components/workspace.css';

/** 공개 전 검증 단계의 검색 노출은 보류하고 실제 도구 설명을 정적으로 제공한다. */
export const metadata: Metadata = {
  title: '이미지 용량 줄이기 · JPG·PNG·WebP 압축 | Toolbax',
  description:
    'JPG·PNG·WebP 이미지 한 장을 브라우저에서 압축하고 실제 결과 용량을 확인하세요. 원본 형식과 해상도를 유지하며 목표 용량 감소율을 조절합니다. 이미지는 서버로 보내지 않습니다.',
  alternates: { canonical: 'https://work.limjaejoon.com/image-compressor/' },
  robots: { index: false, follow: true },
  openGraph: {
    title: '이미지 용량 줄이기 | Toolbax',
    description: '이미지 한 장을 위한 Toolbax 작업 공간',
    url: 'https://work.limjaejoon.com/image-compressor/',
    locale: 'ko_KR',
    type: 'website',
  },
};

/** 제목은 정적 HTML로 제공하고 파일 선택과 가방 조작만 브라우저에 맡긴다. */
export default function ImageCompressorPage() {
  return (
    <main className={styles.page}>
      <div className={styles.brand}>
        <BagBackLink />
        <h1 className={styles.title}>이미지 용량 줄이기</h1>
      </div>
      <ImageWorkspace />
    </main>
  );
}
