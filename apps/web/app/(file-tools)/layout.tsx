import type { ReactNode } from 'react';
import * as styles from './_components/tools.css';

/** 문서 도구의 본문 너비와 종이 작업대 배경을 공통으로 유지한다. */
export default function FileToolsLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.page}>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
