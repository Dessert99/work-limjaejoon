'use client';
/* eslint-disable @next/next/no-img-element -- 브라우저에서 고른 파일과 Worker 결과의 Object URL을 원본 비율로 표시한다. */
import { useEffect, useRef, useState } from 'react';
import { runImageWorker } from '@/domains/image-converter/lib/run-image-worker';
import PressButton from './PressButton';
import ImageSettings from './ImageSettings';
import * as styles from './workspace.css';

type Preview = {
  url?: string;
  name: string;
  size: string;
  bytes: number;
  dimensions?: string;
};
type Result = Preview & {
  url: string;
  saved: number;
  originalReturned: boolean;
  target: number | null;
  targetMet: boolean;
};

function fileSize(bytes: number) {
  return bytes < 1048576
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1048576).toFixed(2)} MB`;
}

/** 한 장을 Worker에서 처리하고 미리보기와 다운로드에 같은 결과 파일을 사용한다. */
export default function ImageWorkspace() {
  const picker = useRef<HTMLInputElement>(null);
  const originalUrl = useRef<string | null>(null);
  const resultUrl = useRef<string | null>(null);
  const source = useRef<File | null>(null);
  const delay = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancel = useRef<(() => void) | null>(null);
  const generation = useRef(0);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [targetReduction, setTargetReduction] = useState(70);
  const [lossless, setLossless] = useState<boolean | null>(null);
  useEffect(
    () => () => {
      generation.current++;
      cancel.current?.();
      if (delay.current) clearTimeout(delay.current);
      if (originalUrl.current) URL.revokeObjectURL(originalUrl.current);
      if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    },
    []
  );
  function interrupt() {
    generation.current++;
    cancel.current?.();
    cancel.current = null;
    if (delay.current) clearTimeout(delay.current);
    delay.current = null;
    if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    resultUrl.current = null;
    setResult(null);
    setProcessing(false);
    return generation.current;
  }
  function reset() {
    // 파일 선택을 취소해도 이전 작업과 결과가 되살아나지 않도록 먼저 종료한다.
    interrupt();
    if (originalUrl.current) URL.revokeObjectURL(originalUrl.current);
    originalUrl.current = null;
    source.current = null;
    setPreview(null);
    setError('');
    setTargetReduction(70);
    setLossless(null);
    if (picker.current) picker.current.value = '';
  }
  function run(file: File, nextTarget: number, job: number) {
    setProcessing(true);
    try {
      cancel.current = runImageWorker(
        {
          files: [file],
          options: {
            format: 'original',
            quality: 80,
            targetReduction: nextTarget,
            maxDimension: null,
          },
        },
        (message) => {
          if (generation.current !== job || message.type === 'progress') return;
          cancel.current = null;
          setProcessing(false);
          if (message.type === 'error') {
            setError(message.message);
            return;
          }
          const converted = message.results[0];
          // 최초 Worker 검증 후에만 원본을 디코딩하고 설정 변경 중에는 그대로 유지한다.
          originalUrl.current ??= URL.createObjectURL(
            new Blob([file], { type: converted.blob.type })
          );
          resultUrl.current = URL.createObjectURL(converted.blob);
          const dimensions = `${converted.width} × ${converted.height}`;
          setPreview((current) => ({
            url: originalUrl.current!,
            name: file.name,
            size: fileSize(file.size),
            bytes: file.size,
            dimensions: current?.dimensions ?? dimensions,
          }));
          setLossless(converted.blob.type === 'image/png');
          setResult({
            url: resultUrl.current,
            name: converted.name,
            size: fileSize(converted.blob.size),
            bytes: converted.blob.size,
            dimensions,
            saved: (1 - converted.blob.size / file.size) * 100,
            originalReturned: converted.originalReturned,
            target: converted.blob.type === 'image/png' ? null : nextTarget,
            targetMet:
              converted.blob.size <=
              Math.floor((file.size * (100 - nextTarget)) / 100),
          });
        }
      );
    } catch {
      setProcessing(false);
      setError(
        '이미지 처리 기능을 실행하지 못했습니다. 최신 브라우저에서 다시 시도해 주세요.'
      );
    }
  }
  function choose(file: File | undefined) {
    if (!file) return;
    if (!file.size || file.size > 90_000_000) {
      setError('파일은 0B보다 크고 90MB 이하여야 합니다.');
      return;
    }
    source.current = file;
    setPreview({
      name: file.name,
      size: fileSize(file.size),
      bytes: file.size,
    });
    run(file, 70, generation.current);
  }
  function update(nextTarget: number) {
    setTargetReduction(nextTarget);
    const job = interrupt();
    setError('');
    const file = source.current;
    if (!file) return;
    setProcessing(true);
    // 슬라이더를 움직이는 동안 반복 생성을 줄이되 이전 결과는 즉시 무효화한다.
    delay.current = setTimeout(() => {
      delay.current = null;
      run(file, nextTarget, job);
    }, 200);
  }
  function download() {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result.url;
    link.download = result.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  return (
    <div className={styles.desk}>
      <div className={styles.toolbar}>
        <PressButton
          aria-label={
            preview
              ? '현재 이미지를 지우고 새 이미지 한 장 선택'
              : '이미지 한 장 선택'
          }
          onClick={() => {
            reset();
            picker.current?.click();
          }}>
          <span aria-hidden='true'>＋ </span>이미지 한 장 선택
        </PressButton>
        <span className={styles.formats}>JPG · PNG · WebP</span>
        <input
          ref={picker}
          type='file'
          accept='image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'
          hidden
          onChange={(event) => choose(event.target.files?.[0])}
        />
      </div>
      <div
        className={styles.prints}
        aria-busy={processing}>
        <figure className={styles.print}>
          <span
            className={styles.tape}
            aria-hidden='true'
          />
          <div className={styles.imageBox}>
            {preview?.url ? (
              <img
                className={styles.photo}
                src={preview.url}
                alt={preview.name}
              />
            ) : (
              <span className={styles.empty}>
                {processing ? '이미지 확인 중' : '이미지 없음'}
              </span>
            )}
          </div>
          <figcaption className={styles.caption}>
            <div className={styles.captionHeader}>
              <span className={styles.captionLabel}>원본 이미지</span>
              <span
                className={styles.fileName}
                title={preview?.name}>
                {preview?.name || '이미지 없음'}
              </span>
            </div>
            <strong className={styles.resultSize}>
              {preview?.size || '선택 전'}
            </strong>
            <span className={styles.facts}>
              <span>{preview?.dimensions}</span>
            </span>
          </figcaption>
        </figure>
        <figure className={styles.print}>
          <span
            className={styles.tape}
            aria-hidden='true'
          />
          <div className={styles.imageBox}>
            {result ? (
              <img
                className={styles.photo}
                src={result.url}
                alt='압축 결과 미리보기'
              />
            ) : (
              <span className={styles.empty}>
                {processing ? '압축 중' : '결과 없음'}
              </span>
            )}
          </div>
          <figcaption className={styles.caption}>
            <div className={styles.captionHeader}>
              <span className={styles.captionLabel}>압축한 이미지</span>
              <span
                className={styles.fileName}
                title={result?.name}>
                {result?.name || '결과 없음'}
              </span>
            </div>
            {result && (
              <>
                <strong className={styles.resultSize}>{result.size}</strong>
                <span className={styles.facts}>
                  <span>
                    {result.originalReturned
                      ? '원본 유지'
                      : `${Math.abs(result.saved).toFixed(1)}% ${result.saved < 0 ? '증가' : '감소'}`}
                  </span>
                  <span>{result.dimensions}</span>
                </span>
              </>
            )}
          </figcaption>
        </figure>
      </div>
      <div className={styles.resultBar}>
        {preview && (
          <ImageSettings
            target={targetReduction}
            targetSize={fileSize(
              Math.floor(
                ((preview?.bytes ?? 0) * (100 - targetReduction)) / 100
              )
            )}
            lossless={lossless === true}
            disabled={lossless === null}
            onTargetChange={update}
          />
        )}
        <div className={styles.downloadAction}>
          <PressButton
            disabled={!result || processing}
            aria-label='현재 이미지 결과 다운로드'
            onClick={download}>
            다운로드
          </PressButton>
        </div>
        <p
          className={styles.status}
          role='status'>
          {error ||
            (processing
              ? '브라우저에서 압축 중입니다.'
              : result
                ? result.target !== null && !result.targetMet
                  ? `목표 ${result.target}% 감소에 미달했습니다. 실제 ${result.saved.toFixed(1)}% 감소입니다.`
                  : result.target === 0
                    ? '원본을 그대로 제공합니다.'
                    : result.originalReturned
                      ? '용량이 줄지 않아 원본을 유지했습니다.'
                      : '압축 완료 · 이미지는 서버로 보내지 않습니다.'
                : 'JPG · PNG · WebP · 이미지는 서버로 보내지 않습니다.')}
        </p>
      </div>
    </div>
  );
}
