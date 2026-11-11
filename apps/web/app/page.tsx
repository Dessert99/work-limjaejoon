import type { Metadata } from 'next';
import Link from 'next/link';
import { toolRoutes } from '@/domains/workspace/config/tool-routes';
import WorkspacePreview from './_components/workspace/WorkspacePreview';
import * as styles from './_components/workspace/preview.css';

/** 홈 화면의 검색 정보를 정적으로 제공한다. */
export const metadata: Metadata = {
  title: '작업 도구 모음',
  description: '과제와 제출 준비에 필요한 도구를 한곳에서 만나보세요.',
};

/** 3D 작업방과 정적 도구 목록을 함께 제공해 장면 로딩에 탐색이 막히지 않게 한다. */
export default function HomePage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.srOnly}>작업 도구 모음</h1>
      <div className={styles.sceneViewport}>
        <WorkspacePreview />
      </div>
      <nav
        className={styles.toolDirectory}
        aria-labelledby='tool-directory-title'>
        <h2 id='tool-directory-title'>작업 도구</h2>
        <p className={styles.note}>
          3D 장면을 기다리지 않고 도구를 바로 열 수 있습니다.
        </p>
        <ul className={styles.toolList}>
          {toolRoutes.map((tool) => (
            <li key={tool.href}>
              <Link
                href={tool.href}
                prefetch={false}
                className={styles.directoryLink}>
                <strong>{tool.label}</strong>
                <span>{tool.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
