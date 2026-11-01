import type { Metadata } from 'next';
import ToolbaxPreview from './_components/toolbax/ToolbaxPreview';
import * as styles from './_components/toolbax/preview.css';

/** 정적 미리보기 페이지의 검색 정보를 제공한다. */
export const metadata: Metadata = {
  title: 'Toolbax 미리보기',
  description:
    'Toolbax 가방 캐릭터의 표정과 금빛 주머니 애니메이션을 확인합니다.',
};

/** 페이지 설명을 먼저 보여주고 3D 장면은 브라우저에서 불러온다. */
export default function HomePage() {
  return (
    <main className={styles.page}>
      <h1>Toolbax 미리보기</h1>
      <ToolbaxPreview />
    </main>
  );
}
