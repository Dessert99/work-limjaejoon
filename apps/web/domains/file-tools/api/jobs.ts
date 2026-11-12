import type { FileJob, FileTool } from '../model/file-tools';

const base =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === 'production'
    ? 'https://work-api.limjaejoon.com'
    : 'http://localhost:3101');
const states = ['uploading', 'queued', 'processing', 'completed', 'failed'];

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 서버 응답이 화면의 작업 계약을 지키는지 경계에서 확인한다. */
export function parseJob(value: unknown): FileJob {
  if (
    !record(value) ||
    typeof value.id !== 'string' ||
    !/^[A-Za-z0-9_-]{16,128}$/.test(value.id) ||
    typeof value.state !== 'string' ||
    !states.includes(value.state) ||
    (value.message !== undefined && typeof value.message !== 'string')
  )
    throw new Error('서버 작업 응답을 확인할 수 없습니다.');
  if (value.result !== undefined) {
    const result = value.result;
    if (
      !record(result) ||
      typeof result.name !== 'string' ||
      typeof result.size !== 'number' ||
      !Number.isSafeInteger(result.size) ||
      result.size < 0 ||
      (result.originalReturned !== undefined &&
        typeof result.originalReturned !== 'boolean')
    )
      throw new Error('서버 결과 정보를 확인할 수 없습니다.');
  }
  if (value.state === 'completed' && value.result === undefined)
    throw new Error('완료한 작업의 결과 정보가 없습니다.');
  return value as FileJob;
}

async function responseJson(response: Response): Promise<unknown> {
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      record(body) && typeof body.message === 'string'
        ? body.message
        : '서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.'
    );
  }
  return body;
}

/** 파일은 작업 식별자를 받은 뒤 한 요청에 하나씩 업로드한다. */
export async function createJob(
  tool: FileTool,
  options: unknown,
  signal: AbortSignal
) {
  return parseJob(
    await responseJson(
      await fetch(`${base}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool, options }),
        signal,
      })
    )
  );
}

/** 대용량 파일도 전송 진행률을 확인하고 요청 취소를 전파한다. */
export function uploadFile(
  id: string,
  file: File,
  signal: AbortSignal,
  progress: (ratio: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    const finish = (error?: Error) => {
      signal.removeEventListener('abort', abort);
      if (error) reject(error);
      else resolve();
    };
    xhr.open('POST', `${base}/jobs/${encodeURIComponent(id)}/files`);
    xhr.timeout = 120_000;
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) progress(event.loaded / event.total);
    };
    xhr.onerror = () => finish(new Error('파일 업로드에 실패했습니다.'));
    xhr.ontimeout = () =>
      finish(new Error('파일 업로드 시간이 초과되었습니다.'));
    xhr.onabort = () =>
      finish(new DOMException('작업을 취소했습니다.', 'AbortError'));
    xhr.onload = () => {
      let body: unknown;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        finish(new Error('업로드 응답을 확인할 수 없습니다.'));
        return;
      }
      if (xhr.status < 200 || xhr.status >= 300) {
        finish(
          new Error(
            record(body) && typeof body.message === 'string'
              ? body.message
              : '파일을 업로드하지 못했습니다.'
          )
        );
      } else if (
        !record(body) ||
        !Number.isSafeInteger(body.count) ||
        Number(body.count) < 1
      ) {
        finish(new Error('업로드 결과를 확인할 수 없습니다.'));
      } else finish();
    };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) {
      finish(new DOMException('작업을 취소했습니다.', 'AbortError'));
      return;
    }
    const form = new FormData();
    form.append('file', file);
    xhr.send(form);
  });
}

/** 업로드 완료 후 서버의 처리 대기열에 작업을 넣는다. */
export async function startJob(id: string, signal: AbortSignal) {
  return parseJob(
    await responseJson(
      await fetch(`${base}/jobs/${encodeURIComponent(id)}/start`, {
        method: 'POST',
        signal,
      })
    )
  );
}

/** 파일 내용을 다시 보내지 않고 작업 상태만 조회한다. */
export async function readJob(id: string, signal: AbortSignal) {
  return parseJob(
    await responseJson(
      await fetch(`${base}/jobs/${encodeURIComponent(id)}`, {
        signal,
        cache: 'no-store',
      })
    )
  );
}

/** 취소와 화면 이탈 때 서버에 남은 입력과 결과 정리를 요청한다. */
export async function deleteJob(id: string) {
  await fetch(`${base}/jobs/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    keepalive: true,
  });
}

/** 완료한 결과를 한 번 받아 브라우저의 다운로드 파일로 사용한다. */
export async function downloadJob(id: string, signal: AbortSignal) {
  const response = await fetch(
    `${base}/jobs/${encodeURIComponent(id)}/download`,
    { signal }
  );
  if (!response.ok) {
    await responseJson(response);
    throw new Error('결과를 다운로드하지 못했습니다.');
  }
  return response.blob();
}
