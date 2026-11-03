'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import * as styles from './preview.css';
import LoadingScreen from './LoadingScreen';
import Fallback from './Fallback';
import SceneBoundary from './SceneBoundary';

const Scene = dynamic(() => import('./ToolbaxScene'), {
  ssr: false,
});

/** 진입 시 한 번 재생하고 버튼이나 가방 클릭으로 다시 재생한다. */
export default function ToolbaxPreview() {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [loadingFinished, setLoadingFinished] = useState(false);
  const [entered, setEntered] = useState(false);
  const [failed, setFailed] = useState(false);
  const complete = ready && loadingFinished;
  const finishLoading = useCallback(() => setLoadingFinished(true), []);
  useEffect(() => {
    if (!complete || failed) return;
    // 백그라운드 장면 준비와 지퍼 완료를 모두 기다린 뒤 공개한다.
    const timer = window.setTimeout(() => setEntered(true), 250);
    return () => window.clearTimeout(timer);
  }, [complete, failed]);
  const markReady = useCallback(() => setReady(true), []);
  const markFailed = useCallback(() => setFailed(true), []);
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
      <button
        className={styles.button}
        onClick={replay}
        disabled={!entered || failed || reduced !== false}>
        다시 재생
      </button>
      <div
        className={entered || failed ? styles.stage : styles.preparingStage}
        aria-label='Toolbax 작업방'
        aria-hidden={!entered && !failed}>
        <SceneBoundary fallback={<Fallback onError={markFailed} />}>
          {reduced !== null && (
            <Scene
              enabled={entered && !failed}
              onReady={markReady}
              host={host}
              run={run}
              reduced={reduced}
              onReplay={replay}
              onStatus={report}
              fallback={<Fallback onError={markFailed} />}
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
