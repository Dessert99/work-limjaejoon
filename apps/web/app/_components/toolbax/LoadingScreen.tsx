'use client';
import { useEffect, useRef, useState } from 'react';
import { colors } from '@/lib/styles/tokens';
import * as styles from './preview.css';

type Props = { onFinished: () => void; reduced: boolean | null };

/** 천과 지퍼를 벌려 고정된 안감을 드러내며 장면 진입을 기다린다. */
export default function LoadingScreen({ onFinished, reduced }: Props) {
  const [progress, setProgress] = useState(0);
  const current = useRef(0);
  useEffect(() => {
    if (reduced === null) return;
    if (reduced) {
      const timer = window.setTimeout(onFinished, 3000);
      return () => window.clearTimeout(timer);
    }
    let previous = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      // GLB 처리로 멈춘 시간을 한꺼번에 더하면 지퍼가 중간에서 끝으로 건너뛴다.
      const step = document.hidden ? 0 : Math.min(now - previous, 50);
      previous = now;
      current.current = Math.min(1, current.current + step / 3000);
      setProgress(current.current);
      if (current.current < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onFinished, reduced]);

  useEffect(() => {
    if (reduced !== false || progress < 1) return;
    let frame = requestAnimationFrame(() => {
      // 마지막 SVG 상태가 DOM에 반영되고 실제로 그려진 뒤에만 전환을 허용한다.
      frame = requestAnimationFrame(onFinished);
    });
    return () => cancelAnimationFrame(frame);
  }, [onFinished, progress, reduced]);

  const shown = reduced ? 1 : progress;
  const slider = 21 + 196 * shown;
  const offset = (x: number) =>
    x < slider && slider > 22
      ? 10 * Math.sin((Math.PI * (x - 21)) / (slider - 21))
      : 0;
  const edge = (side: number) => {
    const points = Array.from({ length: 99 }, (_, index) => {
      const x = 21 + index * 2;
      return `${x.toFixed(2)},${(27 + side * offset(x)).toFixed(2)}`;
    });
    return (side < 0 ? points.reverse() : points).join(' L');
  };

  return (
    <div
      className={styles.loadingScreen}
      role='status'
      aria-label='작업방을 불러오는 중'>
      <div>
        <p className={styles.loadingText}>loading ...</p>
        <svg
          className={styles.loadingBag}
          viewBox='0 0 240 54'
          aria-hidden='true'>
          <path
            d='M10 17H4v20h6m220-20h6v20h-6'
            fill='none'
            stroke={colors.loadingBagLoop}
            strokeWidth='3'
          />
          <rect
            x='8'
            y='8'
            width='224'
            height='38'
            rx='11'
            fill={colors.loadingBagBody}
            stroke={colors.loadingBagOutline}
          />
          <rect
            x='15'
            y='13'
            width='210'
            height='28'
            rx='8'
            fill={colors.loadingBagLining}
          />
          <path
            d={`M21 8 H219 Q232 8 232 21 V27 H217 L${edge(-1)} H8 V21 Q8 8 21 8Z`}
            fill={colors.loadingBagTop}
            stroke={colors.loadingBagSeam}
            strokeWidth='.8'
          />
          <path
            d={`M8 27 H21 L${edge(1)} H232 V33 Q232 46 219 46 H21 Q8 46 8 33Z`}
            fill={colors.loadingBagBottom}
            stroke={colors.loadingBagSeam}
            strokeWidth='.8'
          />
          <path
            d='M23 13H217M23 41H217'
            fill='none'
            stroke={colors.loadingBagStitch}
            strokeWidth='.7'
            strokeDasharray='2 3'
          />
          <g fill={colors.loadingZipTeeth}>
            {Array.from({ length: 40 }, (_, index) => {
              const x = 22 + index * 5;
              const gap = offset(x);
              return (
                <g key={x}>
                  <rect
                    x={x}
                    y={24 - gap}
                    width='2.3'
                    height='2.5'
                    rx='.3'
                  />
                  <rect
                    x={x + 1}
                    y={27.5 + gap}
                    width='2.3'
                    height='2.5'
                    rx='.3'
                  />
                </g>
              );
            })}
          </g>
          <g transform={`translate(${slider.toFixed(2)} 27)`}>
            <path
              d='M-5-5H5L7 0 5 5H-5L-7 0Z'
              fill={colors.loadingZipSlider}
              stroke={colors.loadingBackground}
            />
            <path
              d='m0 2 9 12'
              stroke={colors.loadingZipLink}
              strokeWidth='3'
            />
            <path
              d='m7 11 6 7 5-4-6-7Z'
              fill={colors.loadingZipPull}
              stroke={colors.loadingZipOutline}
            />
            <path
              d='m11 13 2 3'
              stroke={colors.loadingBackground}
              strokeWidth='1.5'
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
