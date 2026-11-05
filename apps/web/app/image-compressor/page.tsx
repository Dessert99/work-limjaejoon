import type { Metadata } from 'next';
import Link from 'next/link';
import ImageWorkspace from './_components/ImageWorkspace';
import * as styles from './_components/workspace.css';

/** 검색 결과와 공유 링크가 실제 이미지 압축 기능을 설명하도록 맞춘다. */
export const metadata: Metadata = {
  title: '이미지 용량 줄이기 · JPG·PNG·WebP 압축',
  description:
    'JPG·PNG·WebP 이미지 한 장을 브라우저에서 압축하고 실제 결과 용량을 확인하세요. 원본 형식과 해상도를 유지하며 목표 용량 감소율을 조절합니다. 이미지는 서버로 보내지 않습니다.',
  alternates: { canonical: 'https://work.limjaejoon.com/image-compressor/' },
  robots: { index: true, follow: true },
  openGraph: {
    title: '이미지 용량 줄이기',
    description:
      'JPG·PNG·WebP 이미지의 형식과 해상도를 유지하며 용량을 줄이세요. 이미지는 브라우저에서만 처리합니다.',
    url: 'https://work.limjaejoon.com/image-compressor/',
    locale: 'ko_KR',
    type: 'website',
  },
};

/** 제목과 홈 링크는 정적 HTML로 제공하고 이미지 처리만 브라우저에 맡긴다. */
export default function ImageCompressorPage() {
  return (
    <main className={styles.page}>
      <div className={styles.brand}>
        <Link
          href='/'
          prefetch={false}
          className={styles.homeLink}
          aria-label='홈으로'>
          <span aria-hidden='true'>←</span> 홈으로
        </Link>
        <h1 className={styles.title}>이미지 용량 줄이기</h1>
        <p className={styles.description}>
          JPG·PNG·WebP 이미지 한 장을 원본 형식과 해상도 그대로 압축하세요.
        </p>
        <p className={styles.privacy}>
          이미지는 브라우저에서 처리하며 서버로 보내지 않습니다.
        </p>
      </div>
      <ImageWorkspace />
    </main>
  );
}
