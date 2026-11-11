'use client';
import { useEffect, useRef, useState } from 'react';
import type { PdfPreview } from '@/domains/file-tools/lib/pdf-preview';
import type { PdfPage } from '@/domains/file-tools/model/file-tools';
import PdfThumbnail from './PdfThumbnail';
import * as styles from './tools.css';

type Props = {
  files: File[];
  pages: PdfPage[];
  disabled: boolean;
  onReady: (pages: PdfPage[]) => void;
  onChange: (pages: PdfPage[]) => void;
  onLoading: (loading: boolean) => void;
  onError: (error: string) => void;
};

/** 페이지 미리보기는 로컬에서 만들고 편집 지시만 서버 요청에 담는다. */
export default function PdfPageEditor({
  files,
  pages,
  disabled,
  onReady,
  onChange,
  onLoading,
  onError,
}: Props) {
  const [source, setSource] = useState<{
    files: File[];
    preview: PdfPreview;
  } | null>(null);
  const [failedFiles, setFailedFiles] = useState<File[] | null>(null);
  const dragged = useRef<number | null>(null);
  const preview = source?.files === files ? source.preview : null;
  useEffect(() => {
    if (!files.length) {
      onLoading(false);
      return;
    }
    const task = new AbortController();
    let session: PdfPreview | undefined;
    onLoading(files.length > 0);
    void (async () => {
      try {
        const { createPdfPreview } =
          await import('@/domains/file-tools/lib/pdf-preview');
        if (task.signal.aborted) return;
        session = await createPdfPreview(files, task.signal);
        if (task.signal.aborted) {
          await session.destroy();
          return;
        }
        setFailedFiles(null);
        setSource({ files, preview: session });
        onReady(session.pages);
      } catch (cause) {
        if (!task.signal.aborted) {
          setFailedFiles(files);
          onReady([]);
          onError(
            cause instanceof Error
              ? cause.message
              : 'PDF를 읽지 못했습니다. 파일을 확인해 주세요.'
          );
        }
      } finally {
        if (!task.signal.aborted) onLoading(false);
      }
    })();
    return () => {
      task.abort();
      void session?.destroy().catch(() => {});
    };
  }, [files, onReady, onLoading, onError]);
  function move(from: number, to: number) {
    if (disabled || from === to || to < 0 || to >= pages.length) return;
    const next = [...pages];
    next.splice(to, 0, next.splice(from, 1)[0]);
    onChange(next);
  }
  if (!files.length) return null;
  return (
    <section aria-label='PDF 페이지 편집'>
      <p className={styles.note}>
        미리보기는 브라우저에서 표시합니다. 저장할 때 파일을 서버로 보내
        처리합니다. 페이지를 끌거나 이동 버튼으로 순서를 바꾸세요.
      </p>
      {!preview && failedFiles !== files && (
        <p role='status'>페이지를 읽는 중입니다.</p>
      )}
      {preview && (
        <>
          <p>저장할 페이지 {pages.length}개</p>
          <div className={styles.grid}>
            {pages.map((page, index) => (
              <article
                className={styles.card}
                key={`${page.file}:${page.page}`}
                draggable={!disabled}
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/plain', String(index));
                  dragged.current = index;
                }}
                onDragEnd={() => {
                  dragged.current = null;
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  if (event.dataTransfer.files.length) return;
                  event.preventDefault();
                  event.stopPropagation();
                  if (dragged.current !== null) move(dragged.current, index);
                  dragged.current = null;
                }}>
                <PdfThumbnail
                  preview={preview}
                  page={page}
                  name={files[page.file].name}
                />
                <p>
                  {index + 1}번 · {files[page.file].name} 원본 {page.page}쪽 ·{' '}
                  {page.rotation}° 회전
                </p>
                <div className={styles.row}>
                  <button
                    type='button'
                    className={styles.button}
                    disabled={disabled || index === 0}
                    onClick={() => move(index, index - 1)}
                    aria-label={`${index + 1}번 페이지 앞으로 이동`}>
                    ↑
                  </button>
                  <button
                    type='button'
                    className={styles.button}
                    disabled={disabled || index === pages.length - 1}
                    onClick={() => move(index, index + 1)}
                    aria-label={`${index + 1}번 페이지 뒤로 이동`}>
                    ↓
                  </button>
                  <button
                    type='button'
                    className={styles.button}
                    disabled={disabled}
                    onClick={() =>
                      onChange(
                        pages.map((entry, i) =>
                          i === index
                            ? {
                                ...entry,
                                rotation: ((entry.rotation + 90) %
                                  360) as PdfPage['rotation'],
                              }
                            : entry
                        )
                      )
                    }
                    aria-label={`${index + 1}번 페이지 회전`}>
                    회전
                  </button>
                  <button
                    type='button'
                    className={styles.button}
                    disabled={disabled}
                    onClick={() =>
                      onChange(pages.filter((_, i) => i !== index))
                    }
                    aria-label={`${index + 1}번 페이지 삭제`}>
                    삭제
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!pages.length && (
            <p>
              저장할 페이지가 없습니다. 파일을 다시 선택하면 원본 페이지를
              복원합니다.
            </p>
          )}
        </>
      )}
    </section>
  );
}
