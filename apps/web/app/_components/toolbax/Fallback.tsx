'use client';
import { useEffect } from 'react';
import Poster from './Poster';

/** WebGL 대체 화면으로 전환된 상태를 알린다. */
export default function Fallback({
  onStatus,
}: {
  onStatus: (value: string) => void;
}) {
  useEffect(() => {
    onStatus('3D를 표시할 수 없어 정지 이미지로 보여드립니다.');
  }, [onStatus]);
  return <Poster />;
}
