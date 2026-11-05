import type { Metadata } from 'next';
import BagBackLink from './_components/BagBackLink';
import ImageWorkspace from './_components/ImageWorkspace';
import * as styles from './_components/workspace.css';

/** 검색 결과와 공유 링크가 실제 이미지 압축 기능을 설명하도록 맞춘다. */
export const metadata: Metadata = {
  title: '이미지 용량 줄이기 · JPG·PNG·WebP 압축 | Toolbax',
  description:
    'JPG·PNG·WebP 이미지 한 장을 브라우저에서 압축하고 실제 결과 용량을 확인하세요. 원본 형식과 해상도를 유지하며 목표 용량 감소율을 조절합니다. 이미지는 서버로 보내지 않습니다.',
  alternates: { canonical: 'https://work.limjaejoon.com/image-compressor/' },
  robots: { index: true, follow: true },
  openGraph: {
    title: '이미지 용량 줄이기 | Toolbax',
    description:
      'JPG·PNG·WebP 이미지의 형식과 해상도를 유지하며 용량을 줄이세요. 이미지는 브라우저에서만 처리합니다.',
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
      <section
        className={styles.guide}
        aria-labelledby='image-guide-title'>
        <h2 id='image-guide-title'>JPG·PNG·WebP 이미지 용량 줄이기</h2>
        <p>
          과제나 문서에 첨부할 사진의 용량을 줄여 보세요. 이미지 한 장을
          선택하면 원본 형식과 해상도를 유지하며 압축하고, 원본과 결과의 실제
          용량을 비교할 수 있습니다. 이미지는 브라우저에서 처리하며 서버로
          보내지 않습니다.
        </p>
        <h3>사용 방법</h3>
        <ol>
          <li>+ 버튼을 눌러 JPG, PNG 또는 WebP 이미지 한 장을 선택합니다.</li>
          <li>
            JPG와 WebP는 용량 감소 목표를 조절합니다. PNG는 별도 설정 없이
            무손실로 압축합니다.
          </li>
          <li>
            결과 이미지와 실제 용량을 확인한 뒤 Download를 누르면 미리보기에
            사용한 파일을 그대로 저장합니다.
          </li>
        </ol>
        <h3>목표 감소율과 실제 결과</h3>
        <p>
          JPG와 WebP의 감소 목표가 70%라면 원본 용량의 30% 이하를 목표로
          압축합니다. 목표를 높이면 화질이 낮아질 수 있으며, 이미지에 따라 목표
          용량에 도달하지 못할 수 있습니다. 0%는 원본 파일을 그대로 제공합니다.
        </p>
        <p>
          PNG는 화질 손실 없이 압축하므로 이미 최적화된 이미지는 용량이 줄지
          않을 수 있습니다. 압축 결과가 원본보다 작아지지 않으면 원본을
          제공합니다. HEIC, SVG와 움직이는 이미지는 지원하지 않습니다.
        </p>
      </section>
    </main>
  );
}
