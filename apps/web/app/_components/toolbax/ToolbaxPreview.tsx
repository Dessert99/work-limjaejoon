'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import * as styles from './preview.css';
import Poster from './Poster';
import Fallback from './Fallback';
import SceneBoundary from './SceneBoundary';

const Scene = dynamic(() => import('./ToolbaxScene'), {
  ssr: false,
  loading: Poster,
});

/** 진입 시 한 번 재생하고 버튼이나 가방 클릭으로 다시 재생한다. */
export default function ToolbaxPreview() {
  const [run, setRun] = useState(0);
  const [status, setStatus] = useState('불러오는 중');
  const [reduced, setReduced] = useState<boolean | null>(null);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const replay = useCallback(() => setRun((value) => value + 1), []);
  const report = useCallback((value: string) => setStatus(value), []);
  return (
    <>
      <div className={styles.header}>
        <p className={styles.note}>
          가방을 누르면 다시 재생됩니다. 드래그해서 다른 각도도 살펴보세요.
        </p>
        <button
          className={styles.button}
          onClick={replay}
          disabled={reduced !== false || !status.startsWith('재생')}>
          다시 재생
        </button>
      </div>
      <div
        className={styles.stage}
        aria-label='Toolbax 3D 미리보기'>
        <SceneBoundary fallback={<Fallback onStatus={report} />}>
          {reduced === null ? (
            <Poster />
          ) : (
            <Scene
              run={run}
              reduced={reduced}
              onReplay={replay}
              onStatus={report}
              fallback={<Fallback onStatus={report} />}
            />
          )}
        </SceneBoundary>
      </div>
      <p
        className={styles.note}
        role='status'>
        {status}
      </p>
    </>
  );
}
