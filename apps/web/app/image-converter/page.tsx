import type { Metadata } from 'next';
import Link from 'next/link';
import ImageConverter from './_components/ImageConverter';
import * as styles from './_components/converter.css';

/** 형식 변환과 크기 조절 기능을 압축 화면과 구분해 검색 결과에 알린다. */
export const metadata: Metadata = {
  title: '이미지 확장자 변환 · JPG·PNG·WebP 크기 조절',
  description:
    'JPG·PNG·WebP 이미지의 형식과 크기를 브라우저에서 바꾸세요. 실제 결과를 미리 보고 여러 장을 ZIP으로 다운로드합니다. 이미지는 서버로 보내지 않습니다.',
  alternates: { canonical: 'https://work.limjaejoon.com/image-converter/' },
  robots: { index: true, follow: true },
};

/** 설명과 사용법은 정적으로 제공하고 이미지 파일은 브라우저 안에서만 처리한다. */
export default function ImageConverterPage() {
  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <Link
          href='/'
          prefetch={false}
          className={styles.home}>
          ← 홈으로
        </Link>
        <h1 className={styles.title}>이미지 확장자 변환</h1>
        <p>
          JPG·PNG·WebP 형식을 바꾸고 긴 변 크기를 조절하세요. 이미지는
          브라우저에서 처리하며 서버로 보내지 않습니다.
        </p>
        <ImageConverter />
        <section aria-labelledby='image-converter-help'>
          <h2 id='image-converter-help'>사용 방법</h2>
          <p>
            이미지를 최대 30장 선택하고 출력 형식과 품질을 정하세요. 긴 변은
            비워 두면 원본을 유지하며, 값을 입력하면 비율을 유지해 축소합니다.
            작은 이미지를 확대하지 않습니다.
          </p>
          <p>
            선택한 이미지의 실제 결과 용량과 절감률을 확인하고 현재 결과를
            그대로 다운로드할 수 있습니다. 전체 ZIP 다운로드는 미리본 결과를
            재사용하고 나머지 파일을 한 장씩 처리합니다.
          </p>
          <p>
            PNG는 무손실 압축하므로 품질 설정이 없습니다. 파일당 90MB, 합계
            300MB, 이미지당 2,400만 픽셀과 긴 변 16,384px은 임시 안전
            상한입니다.
          </p>
          <p>
            현재 변환 결과는 메타데이터를 제거하며 형식·크기 변경 요청은 용량이
            증가해도 유지합니다. JPG의 투명 부분은 흰색으로 채우고 움직이는
            PNG·WebP는 거부합니다. 이 예외 동작은 임시 기준입니다.
          </p>
          <p>
            HEIC는 지원하지 않습니다. 아이폰에서는 설정의 카메라, 포맷에서 높은
            호환성을 선택하면 JPG로 촬영할 수 있습니다. 원본 형식과 크기를
            유지하며 압축하려면{' '}
            <Link
              href='/image-compressor/'
              prefetch={false}>
              이미지 용량 줄이기
            </Link>
            를 사용하세요.
          </p>
        </section>
      </div>
    </main>
  );
}
