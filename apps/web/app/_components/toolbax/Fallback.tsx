'use client';
import { useEffect } from 'react';
import * as styles from './preview.css';

/** 이미지 대체 없이 오류를 알리고 로딩 대기를 끝낸다. */
export default function Fallback({ onError }: { onError: () => void }) {
  useEffect(() => {
    onError();
  }, [onError]);
  return (
    <div
      className={styles.loadingScreen}
      role='alert'>
      3D 장면을 불러오지 못했습니다. 페이지를 새로고침해 주세요.
    </div>
  );
}
