'use client';
import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

/** 장면 준비와 로딩 연출을 기다리고 화면 전환 뒤 재생을 허용한다. */
export default function useLoadingTransition(reduced: boolean | null) {
  const [ready, setReady] = useState(false);
  const [loadingFinished, setLoadingFinished] = useState(false);
  const [entered, setEntered] = useState(false);
  const [playbackReady, setPlaybackReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const complete = ready && loadingFinished;
  const finishLoading = useCallback(() => setLoadingFinished(true), []);
  useEffect(() => {
    if (!complete || failed || reduced === null) return;
    let cancelled = false;
    let transition: ViewTransition | undefined;
    const finish = () => {
      if (!cancelled) setPlaybackReady(true);
    };
    // 백그라운드 장면 준비와 지퍼 완료를 모두 기다린 뒤 공개한다.
    const timer = window.setTimeout(() => {
      if (reduced || !document.startViewTransition) {
        setEntered(true);
        finish();
        return;
      }
      transition = document.startViewTransition(() => {
        if (cancelled) return;
        // 브라우저가 새 화면을 캡처하기 전에 React의 DOM 변경을 끝낸다.
        flushSync(() => setEntered(true));
      });
      // 전환이 생략돼도 진입을 끝내고, 정상 전환 중에는 3D 첫 동작을 보존한다.
      void transition.finished.then(finish, finish);
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      transition?.skipTransition();
    };
  }, [complete, failed, reduced]);
  const markReady = useCallback(() => setReady(true), []);
  const markFailed = useCallback(() => setFailed(true), []);
  return {
    entered,
    playbackReady,
    failed,
    finishLoading,
    markReady,
    markFailed,
  };
}
