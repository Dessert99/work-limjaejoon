'use client';
import { useEffect, useRef, useState } from 'react';
import {
  createJob,
  deleteJob,
  downloadJob,
  readJob,
  startJob,
  uploadFile,
} from '@/domains/file-tools/api/jobs';
import { fileTools } from '@/domains/file-tools/config/tools';
import {
  formatBytes,
  validateFiles,
} from '@/domains/file-tools/lib/validate-files';
import type {
  FileJob,
  FileTool,
  PdfPage,
} from '@/domains/file-tools/model/file-tools';
import FileList from './FileList';
import PdfPageEditor from './PdfPageEditor';
import * as styles from './tools.css';

const messages = {
  uploading: '업로드 중',
  queued: '처리 대기 중',
  processing: '처리 중',
  completed: '완료',
  failed: '실패',
};

function pause(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException('작업을 취소했습니다.', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, 1000);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
  });
}

/** 파일 선택부터 서버 결과 수신까지의 생명주기를 한 화면에 유지한다. */
export default function FileToolWorkspace({ tool }: { tool: FileTool }) {
  const config = fileTools[tool];
  const [files, setFiles] = useState<File[]>([]);
  const [job, setJob] = useState<FileJob | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const currentJob = useRef<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const downloadUrl = useRef<string | null>(null);
  useEffect(
    () => () => {
      controller.current?.abort();
      if (currentJob.current)
        void deleteJob(currentJob.current).catch(() => {});
      if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current);
    },
    []
  );
  function cancel() {
    controller.current?.abort();
    controller.current = null;
    if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current);
    downloadUrl.current = null;
    const id = currentJob.current;
    currentJob.current = null;
    if (id) void deleteJob(id).catch(() => {});
    setJob(null);
    setBusy(false);
    setDownloading(false);
    setDownloaded(false);
    setProgress(0);
  }
  function choose(next: File[]) {
    cancel();
    setError('');
    if (next.length) {
      try {
        validateFiles(tool, next);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : '파일을 확인해 주세요.'
        );
        return;
      }
    }
    setPages([]);
    setPreviewLoading(tool === 'pdf-edit' && next.length > 0);
    setFiles(next);
  }
  async function run() {
    setError('');
    let options: unknown = {};
    try {
      validateFiles(tool, files);
      if (tool === 'pdf-edit') {
        if (!pages.length) throw new Error('저장할 페이지가 없습니다.');
        options = { pages };
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : '설정을 확인해 주세요.'
      );
      return;
    }
    cancel();
    const task = new AbortController();
    controller.current = task;
    setBusy(true);
    try {
      let state = await createJob(tool, options, task.signal);
      // 취소 직후 생성된 작업도 서버에 남기지 않는다.
      if (task.signal.aborted || controller.current !== task) {
        void deleteJob(state.id).catch(() => {});
        return;
      }
      currentJob.current = state.id;
      setJob(state);
      const total = files.reduce((sum, file) => sum + file.size, 0);
      let sent = 0;
      for (const file of files) {
        await uploadFile(state.id, file, task.signal, (ratio) => {
          if (!task.signal.aborted && controller.current === task)
            setProgress(Math.round(((sent + file.size * ratio) / total) * 100));
        });
        sent += file.size;
      }
      state = await startJob(state.id, task.signal);
      if (task.signal.aborted || controller.current !== task) return;
      setJob(state);
      while (state.state !== 'completed' && state.state !== 'failed') {
        await pause(task.signal);
        state = await readJob(state.id, task.signal);
        if (task.signal.aborted || controller.current !== task) return;
        setJob(state);
      }
      if (state.state === 'failed')
        throw new Error(state.message ?? '처리에 실패했습니다.');
    } catch (cause) {
      if (!task.signal.aborted) {
        setError(
          cause instanceof Error ? cause.message : '서버에 연결하지 못했습니다.'
        );
        setJob((previous) =>
          previous ? { ...previous, state: 'failed' } : null
        );
        if (currentJob.current)
          void deleteJob(currentJob.current).catch(() => {});
        currentJob.current = null;
      }
    } finally {
      if (controller.current === task) setBusy(false);
    }
  }
  async function download() {
    if (!job?.result || !currentJob.current) return;
    const task = new AbortController();
    controller.current = task;
    setDownloading(true);
    setError('');
    try {
      const blob = await downloadJob(job.id, task.signal);
      // 전송 완료 직전 취소된 결과가 뒤늦게 다운로드되지 않게 한다.
      if (task.signal.aborted || controller.current !== task) return;
      if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current);
      downloadUrl.current = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl.current;
      link.download = job.result.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setDownloaded(true);
      currentJob.current = null;
    } catch (cause) {
      if (!task.signal.aborted)
        setError(
          cause instanceof Error ? cause.message : '다운로드하지 못했습니다.'
        );
    } finally {
      if (controller.current === task) setDownloading(false);
    }
  }
  const total = files.reduce((sum, file) => sum + file.size, 0);
  return (
    <section
      className={styles.panel}
      aria-label='파일 작업대'
      onDragOver={(event) => {
        if (!busy && !downloading) event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        if (!busy && !downloading && event.dataTransfer.files.length)
          choose(Array.from(event.dataTransfer.files));
      }}>
      <div className={styles.row}>
        <button
          className={styles.button}
          type='button'
          disabled={busy || downloading}
          onClick={() => picker.current?.click()}>
          파일 선택
        </button>
        <span>최대 {config.maxFiles}개 · 파일당 90MB · 합계 300MB</span>
        <input
          ref={picker}
          hidden
          type='file'
          accept={config.accept}
          multiple={config.maxFiles > 1}
          onChange={(event) => {
            choose(Array.from(event.target.files ?? []));
            event.target.value = '';
          }}
        />
      </div>
      <FileList
        files={files}
        disabled={busy || downloading}
        onChange={choose}
      />
      {files.length > 0 && (
        <p>
          선택한 파일 {files.length}개 · 총 {formatBytes(total)}
        </p>
      )}
      {tool === 'pdf-edit' && (
        <PdfPageEditor
          files={files}
          pages={pages}
          disabled={busy || downloading}
          onReady={setPages}
          onLoading={setPreviewLoading}
          onError={setError}
          onChange={(next) => {
            cancel();
            setError('');
            setPages(next);
          }}
        />
      )}
      <div className={styles.row}>
        <button
          type='button'
          className={styles.button}
          disabled={
            !files.length ||
            busy ||
            downloading ||
            (tool === 'pdf-edit' && (previewLoading || !pages.length))
          }
          onClick={() => void run()}>
          {config.action}
        </button>
        {(busy || job) && (
          <button
            type='button'
            className={styles.button}
            onClick={cancel}>
            작업 취소 및 결과 지우기
          </button>
        )}
      </div>
      <div
        aria-live='polite'
        role='status'>
        {job && (
          <div className={styles.status}>
            <strong>{messages[job.state]}</strong>
            {job.state === 'uploading' && (
              <>
                <progress
                  max={100}
                  value={progress}
                  aria-label='업로드 진행률'
                />{' '}
                {progress}%
              </>
            )}
            {job.result && (
              <>
                <p>
                  {job.result.name} · 결과 {formatBytes(job.result.size)} (입력{' '}
                  {formatBytes(total)})
                </p>
                {job.result.originalReturned && (
                  <p>용량이 줄지 않아 원본을 유지했습니다.</p>
                )}
                <button
                  type='button'
                  className={styles.button}
                  disabled={downloading || downloaded}
                  onClick={() => void download()}>
                  {downloading
                    ? '다운로드 중'
                    : downloaded
                      ? '다운로드 완료'
                      : '결과 다운로드'}
                </button>
                {downloaded && (
                  <p>결과를 다시 만들려면 실행 버튼을 눌러 주세요.</p>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {error && <p role='alert'>{error}</p>}
    </section>
  );
}
