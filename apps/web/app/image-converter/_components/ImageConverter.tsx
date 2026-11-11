'use client';
/* eslint-disable @next/next/no-img-element -- 로컬 파일과 Worker 결과의 Object URL을 원래 비율로 비교한다. */

import { useEffect, useRef, useState } from 'react';
import { runImageWorker } from '@/domains/image-converter/lib/run-image-worker';
import { validateImageSelection } from '@/domains/image-converter/lib/validate-image-selection';
import type {
  ConvertOptions,
  ImageResult,
} from '@/domains/image-converter/model/image-converter';
import * as styles from './converter.css';

const initialOptions: ConvertOptions = {
  format: 'image/jpeg',
  quality: 80,
  maxDimension: null,
};

function fileSize(bytes: number) {
  return bytes < 1_000_000
    ? `${(bytes / 1000).toFixed(1)} KB`
    : `${(bytes / 1_000_000).toFixed(2)} MB`;
}

/** 선택한 이미지의 실제 결과를 재사용하고 여러 장은 Worker에서 순차 변환한다. */
export default function ImageConverter() {
  const [files, setFiles] = useState<File[]>([]);
  const [selected, setSelected] = useState(0);
  const [options, setOptions] = useState(initialOptions);
  const [result, setResult] = useState<ImageResult | null>(null);
  const [originalUrl, setOriginalUrl] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('이미지를 선택해 주세요.');
  const [error, setError] = useState('');
  const version = useRef(0);
  const stop = useRef<(() => void) | null>(null);
  const delay = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urls = useRef(new Set<string>());
  const bundle = useRef<{ blob: Blob; name: string } | null>(null);
  useEffect(
    () => () => {
      version.current++;
      stop.current?.();
      if (delay.current) clearTimeout(delay.current);
      for (const url of urls.current) URL.revokeObjectURL(url);
      urls.current.clear();
    },
    []
  );
  function release() {
    version.current++;
    stop.current?.();
    stop.current = null;
    if (delay.current) clearTimeout(delay.current);
    delay.current = null;
    for (const url of urls.current) URL.revokeObjectURL(url);
    urls.current.clear();
    bundle.current = null;
    setOriginalUrl('');
    setResultUrl('');
    setResult(null);
    setBusy(false);
    setError('');
    return version.current;
  }
  function objectUrl(blob: Blob) {
    const url = URL.createObjectURL(blob);
    urls.current.add(url);
    return url;
  }
  function save(blob: Blob, name: string) {
    const link = document.createElement('a');
    link.href = objectUrl(blob);
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  function preview(
    nextFiles: File[],
    nextIndex: number,
    nextOptions: ConvertOptions
  ) {
    const job = release();
    const file = nextFiles[nextIndex];
    if (!file) {
      setStatus('이미지를 선택해 주세요.');
      return;
    }
    setBusy(true);
    setStatus('선택한 이미지 변환 중');
    // 빠른 옵션 변경은 마지막 설정만 처리하고 이전 Worker는 즉시 종료한다.
    delay.current = setTimeout(() => {
      try {
        stop.current = runImageWorker(
          { files: [file], options: nextOptions },
          (message) => {
            if (version.current !== job || message.type === 'progress') return;
            stop.current = null;
            setBusy(false);
            if (message.type === 'error') {
              setError(message.message);
              setStatus('이미지 변환 실패');
              return;
            }
            const converted = message.results[0];
            // 헤더와 픽셀 상한을 통과한 뒤에만 원본 미리보기 디코딩을 허용한다.
            setOriginalUrl(objectUrl(file));
            setResult(converted);
            setResultUrl(objectUrl(converted.blob));
            setStatus('선택한 이미지 변환 완료');
          }
        );
      } catch {
        setBusy(false);
        setError(
          '이미지 처리 기능을 실행하지 못했습니다. 최신 브라우저에서 다시 시도해 주세요.'
        );
      }
    }, 150);
  }
  function update(next: ConvertOptions) {
    setOptions(next);
    preview(files, selected, next);
  }
  function downloadAll() {
    if (!result || busy) return;
    if (bundle.current) {
      save(bundle.current.blob, bundle.current.name);
      return;
    }
    if (files.length === 1) {
      save(result.blob, result.name);
      return;
    }
    const job = version.current;
    setBusy(true);
    setError('');
    setStatus(`전체 변환 중 0/${files.length}`);
    try {
      // 미리본 파일을 다시 인코딩하지 않아 ZIP에서도 같은 결과 바이트를 보장한다.
      stop.current = runImageWorker(
        { files, options, cached: { index: selected, result } },
        (message) => {
          if (version.current !== job) return;
          if (message.type === 'progress') {
            setStatus(`전체 변환 중 ${message.completed}/${message.total}`);
            return;
          }
          stop.current = null;
          setBusy(false);
          if (message.type === 'error') {
            setError(message.message);
            setStatus('전체 변환 실패');
            return;
          }
          bundle.current = { blob: message.download, name: message.name };
          setStatus(`${files.length}장 변환 완료`);
          save(message.download, message.name);
        }
      );
    } catch {
      setBusy(false);
      setError('전체 이미지 변환을 실행하지 못했습니다. 다시 시도해 주세요.');
    }
  }
  return (
    <section
      className={styles.workspace}
      aria-label='이미지 형식 변환'>
      <label className={styles.field}>
        JPG·PNG·WebP 이미지 선택 (최대 30장)
        <input
          type='file'
          accept='.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp'
          multiple
          onChange={(event) => {
            const next = Array.from(event.target.files ?? []);
            release();
            setFiles([]);
            setSelected(0);
            if (!next.length) return;
            try {
              validateImageSelection(next);
            } catch (cause) {
              setError(
                cause instanceof Error ? cause.message : '파일을 확인해 주세요.'
              );
              return;
            }
            setFiles(next);
            preview(next, 0, options);
          }}
        />
      </label>
      <div className={styles.settings}>
        <label className={styles.field}>
          출력 형식
          <select
            value={options.format}
            onChange={(event) =>
              update({
                ...options,
                format: event.target.value as ConvertOptions['format'],
              })
            }>
            <option value='image/jpeg'>JPG</option>
            <option value='image/png'>PNG</option>
            <option value='image/webp'>WebP</option>
          </select>
        </label>
        {options.format !== 'image/png' && (
          <label className={styles.field}>
            품질 {options.quality}
            <input
              type='range'
              min={1}
              max={100}
              value={options.quality}
              onChange={(event) =>
                update({ ...options, quality: Number(event.target.value) })
              }
            />
          </label>
        )}
        <label className={styles.field}>
          긴 변 최대 크기 (px)
          <input
            type='number'
            min={1}
            max={16384}
            placeholder='원본 유지'
            value={options.maxDimension ?? ''}
            onChange={(event) =>
              update({
                ...options,
                maxDimension:
                  event.target.value === '' ? null : Number(event.target.value),
              })
            }
          />
        </label>
      </div>
      {files.length > 0 && (
        <label className={styles.field}>
          미리볼 이미지
          <select
            value={selected}
            onChange={(event) => {
              const index = Number(event.target.value);
              setSelected(index);
              preview(files, index, options);
            }}>
            {files.map((file, index) => (
              <option
                key={index}
                value={index}>
                {index + 1}. {file.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className={styles.previews}>
        <figure className={styles.print}>
          <figcaption>
            원본 {files[selected] ? `· ${fileSize(files[selected].size)}` : ''}
          </figcaption>
          {originalUrl ? (
            <img
              className={styles.image}
              src={originalUrl}
              alt='원본 이미지 미리보기'
            />
          ) : (
            <p>이미지 없음</p>
          )}
        </figure>
        <figure className={styles.print}>
          <figcaption>
            변환 결과{' '}
            {result
              ? `· ${fileSize(result.blob.size)} · ${result.width} × ${result.height}`
              : ''}
          </figcaption>
          {resultUrl ? (
            <img
              className={styles.image}
              src={resultUrl}
              alt='변환 결과 미리보기'
            />
          ) : (
            <p>{busy ? '변환 중' : '결과 없음'}</p>
          )}
          {result && (
            <p>
              {result.blob.size <= result.originalSize
                ? `${((1 - result.blob.size / result.originalSize) * 100).toFixed(1)}% 절감`
                : `${((result.blob.size / result.originalSize - 1) * 100).toFixed(1)}% 증가`}
            </p>
          )}
        </figure>
      </div>
      <p
        role='status'
        aria-live='polite'>
        {status}
      </p>
      {error && <p role='alert'>{error}</p>}
      <div className={styles.actions}>
        <button
          className={styles.button}
          disabled={!result || busy}
          onClick={() => result && save(result.blob, result.name)}>
          현재 결과 다운로드
        </button>
        <button
          className={styles.button}
          disabled={!result || busy}
          onClick={downloadAll}>
          {files.length > 1 ? '전체 ZIP 다운로드' : '전체 다운로드'}
        </button>
      </div>
    </section>
  );
}
