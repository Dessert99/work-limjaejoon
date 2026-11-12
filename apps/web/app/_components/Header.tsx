import Image from 'next/image';
import Link from 'next/link';
import HeaderNav from './HeaderNav';
import * as styles from './header.css';

/** 모든 화면에서 같은 브랜드와 현재 제공하는 도구의 이동 경로를 제공한다. */
export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link
          href='/'
          prefetch={false}
          className={styles.brand}
          aria-label='작업 도구 모음 홈으로'>
          <span className={styles.mark}>
            <Image
              src='/models/workspace/bag-icon.png'
              alt=''
              width={56}
              height={48}
              unoptimized
            />
          </span>
          <span>
            <span className={styles.name}>작업 도구 모음</span>
            <span className={styles.tagline}>자주 쓰는 도구, 한곳에.</span>
          </span>
        </Link>
        <HeaderNav />
      </div>
    </header>
  );
}
