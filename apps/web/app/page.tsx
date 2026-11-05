import type { Metadata } from 'next';
import WorkspacePreview from './_components/workspace/WorkspacePreview';
import * as styles from './_components/workspace/preview.css';

/** 홈 화면의 검색 정보를 정적으로 제공한다. */
export const metadata: Metadata = {
  title: '작업 도구 모음',
  description: '과제와 제출 준비에 필요한 도구를 한곳에서 만나보세요.',
};

/** 방 전체를 홈 화면으로 사용하고 3D 장면은 브라우저에서 불러온다. */
export default function HomePage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.srOnly}>작업 도구 모음</h1>
      <WorkspacePreview />
    </main>
  );
}
