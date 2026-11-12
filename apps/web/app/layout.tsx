import type { ReactNode } from 'react';
import Header from './_components/Header';
import './layout.css';

/** 모든 페이지에 한국어 문서의 기본 구조를 제공한다. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='ko'>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
