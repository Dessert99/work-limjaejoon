import type { Metadata } from 'next';
import ToolbaxPreview from './_components/toolbax/ToolbaxPreview';
import * as styles from './_components/toolbax/preview.css';

/** 홈 화면의 검색 정보를 정적으로 제공한다. */
export const metadata: Metadata = {
  title: 'Toolbax',
  description:
    '과제와 제출 준비에 필요한 도구를 Toolbax 작업방에서 만나보세요.',
};

/** 방 전체를 홈 화면으로 사용하고 3D 장면은 브라우저에서 불러온다. */
export default function HomePage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.srOnly}>Toolbax</h1>
      <ToolbaxPreview />
    </main>
  );
}
