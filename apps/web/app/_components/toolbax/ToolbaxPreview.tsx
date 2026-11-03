'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import * as styles from './preview.css';
import LoadingScreen from './loading/LoadingScreen';
import Fallback from './loading/Fallback';
import SceneBoundary from './SceneBoundary';
import useLoadingTransition from './loading/useLoadingTransition';

const Scene = dynamic(() => import('./ToolbaxScene'), {
  ssr: false,
});

/** 첫 진입 연출 뒤에는 가방의 대기 동작만 반복한다. */
export default function ToolbaxPreview() {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [reduced, setReduced] = useState<boolean | null>(null);
  const {
    entered,
    playbackReady,
    failed,
    finishLoading,
    markReady,
    markFailed,
  } = useLoadingTransition(reduced);
  const [status, setStatus] = useState('불러오는 중');
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const report = useCallback((value: string) => setStatus(value), []);
  return (
    <>
      <div
        className={entered || failed ? styles.stage : styles.preparingStage}
        aria-label='Toolbax 작업방'
        aria-hidden={!entered && !failed}>
        <SceneBoundary fallback={<Fallback onError={markFailed} />}>
          {reduced !== null && (
            <Scene
              enabled={playbackReady && !failed}
              onReady={markReady}
              host={host}
              reduced={reduced}
              onStatus={report}
            />
          )}
        </SceneBoundary>
        <div
          ref={setHost}
          className={styles.labelHost}
        />
      </div>
      {!entered && !failed && (
        <LoadingScreen
          onFinished={finishLoading}
          reduced={reduced}
        />
      )}
      <p
        className={styles.srOnly}
        role='status'>
        {status}
      </p>
    </>
  );
}
