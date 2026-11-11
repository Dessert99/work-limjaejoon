import type { ReactNode } from 'react';
import Link from 'next/link';
import { fileTools } from '@/domains/file-tools/config/tools';
import * as styles from './_components/tools.css';

/** 정적 도구 이동을 제공하고 3D 장면은 문서 화면에 불러오지 않는다. */
export default function FileToolsLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <nav
          className={styles.nav}
          aria-label='도구 이동'>
          <Link
            href='/'
            prefetch={false}>
            홈으로
          </Link>
          {Object.values(fileTools).map((tool) => (
            <Link
              key={tool.path}
              href={`/${tool.path}/`}
              prefetch={false}>
              {tool.title}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}
