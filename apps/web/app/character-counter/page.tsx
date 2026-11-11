import type { Metadata } from 'next';
import Link from 'next/link';
import CharacterCounter from './_components/CharacterCounter';
import * as styles from './_components/counter.css';

/** 글자 수 계산 방법과 브라우저 처리 원칙을 검색 결과에 알린다. */
export const metadata: Metadata = {
  title: '글자 수 세기 · 공백 포함·제외와 바이트 계산',
  description:
    '자소서와 과제의 공백 포함·제외 글자 수, EUC-KR 방식과 UTF-8 바이트 수를 바로 확인하세요. 입력한 글은 서버로 보내지 않습니다.',
  alternates: { canonical: 'https://work.limjaejoon.com/character-counter/' },
  robots: { index: true, follow: true },
};

/** 정적 설명과 사용법을 제공하고 입력과 임시 저장만 브라우저에 맡긴다. */
export default function CharacterCounterPage() {
  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <Link
          href='/'
          prefetch={false}
          className={styles.home}>
          ← 홈으로
        </Link>
        <h1 className={styles.title}>글자 수 세기</h1>
        <p>
          자소서와 과제 분량을 확인하세요. 입력한 글은 서버로 보내지 않습니다.
        </p>
        <CharacterCounter />
        <section
          className={styles.help}
          aria-labelledby='counter-help'>
          <h2 id='counter-help'>사용 방법</h2>
          <p>
            글을 입력하거나 붙여 넣으면 공백 포함·제외 글자 수와 바이트 수를
            바로 계산합니다. 작성 중인 글은 같은 브라우저에서 다시 열면
            복원됩니다.
          </p>
          <p>
            이모지와 결합 문자는 화면에 보이는 글자 단위로 셉니다. 공백
            제외에서는 띄어쓰기, 줄바꿈, 탭을 제외합니다.
          </p>
          <p>
            EUC-KR 방식은 ASCII 문자 1byte, 그 외 문자를 2byte로 계산하는
            기준입니다. 실제 EUC-KR 파일 인코딩 크기와는 다를 수 있으며, 제출
            사이트의 계산 결과를 함께 확인하세요. UTF-8은 실제 인코딩 바이트
            수입니다.
          </p>
        </section>
      </div>
    </main>
  );
}
