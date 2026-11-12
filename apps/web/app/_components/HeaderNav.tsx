'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toolRoutes } from '@/domains/workspace/config/tool-routes';
import * as styles from './header.css';

/** 현재 도구를 강조하고 작은 화면에서는 모든 메뉴를 가로로 탐색하게 한다. */
export default function HeaderNav() {
  const pathname = usePathname();
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    // 직접 접속한 도구도 모바일 메뉴의 가려진 영역에 남지 않게 한다.
    nav.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [pathname]);
  return (
    <nav
      ref={nav}
      className={styles.nav}
      aria-label='전체 도구'>
      <ul className={styles.list}>
        {toolRoutes.map((tool, index) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              prefetch={false}
              aria-current={
                pathname === tool.href || `${pathname}/` === tool.href
                  ? 'page'
                  : undefined
              }
              className={styles.link}>
              <span
                className={styles.number}
                aria-hidden='true'>
                {String(index + 1).padStart(2, '0')}
              </span>
              {tool.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
