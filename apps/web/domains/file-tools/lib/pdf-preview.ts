import type { PDFDocumentLoadingTask } from 'pdfjs-dist';
import type { PdfPage } from '../model/file-tools';

/** 문서와 Worker는 하나만 유지하고 작은 페이지 썸네일을 순차 생성한다. */
export type PdfPreview = {
  pages: PdfPage[];
  render: (
    page: PdfPage,
    canvas: HTMLCanvasElement,
    signal: AbortSignal
  ) => Promise<void>;
  destroy: () => Promise<void>;
};

/** 선택한 파일은 로컬 Blob으로만 읽고 PDF 저장은 서버에 맡긴다. */
export async function createPdfPreview(
  files: File[],
  signal: AbortSignal
): Promise<PdfPreview> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
  let current: {
    file: number;
    task: PDFDocumentLoadingTask;
    url: string;
  } | null = null;
  let destroyed = false;
  let queue = Promise.resolve();
  async function closeDocument() {
    const previous = current;
    current = null;
    if (previous) {
      try {
        await previous.task.destroy();
      } finally {
        URL.revokeObjectURL(previous.url);
      }
    }
  }
  async function destroy() {
    destroyed = true;
    signal.removeEventListener('abort', abort);
    await closeDocument();
  }
  function abort() {
    void destroy().catch(() => {});
  }
  signal.addEventListener('abort', abort, { once: true });
  async function open(file: number) {
    if (destroyed || signal.aborted)
      throw new DOMException('미리보기를 취소했습니다.', 'AbortError');
    if (current?.file === file) return current.task.promise;
    await closeDocument();
    if (destroyed || signal.aborted)
      throw new DOMException('미리보기를 취소했습니다.', 'AbortError');
    const url = URL.createObjectURL(files[file]);
    const task = pdfjs.getDocument({
      url,
      useSystemFonts: true,
      disableAutoFetch: true,
      disableStream: true,
      useWasm: false,
      maxImageSize: 24_000_000,
    });
    current = { file, task, url };
    try {
      return await task.promise;
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'PasswordException')
        throw new Error('암호가 걸린 PDF는 지원하지 않습니다.');
      throw cause;
    }
  }
  try {
    const pages: PdfPage[] = [];
    for (let file = 0; file < files.length; file++) {
      const document = await open(file);
      for (let page = 1; page <= document.numPages; page++)
        pages.push({ file, page, rotation: 0 });
    }
    function render(
      page: PdfPage,
      canvas: HTMLCanvasElement,
      localSignal: AbortSignal
    ) {
      // 동시에 여러 Canvas가 큰 PDF 디코더를 점유하지 않도록 직렬화한다.
      const action = queue.then(async () => {
        if (localSignal.aborted || destroyed) return;
        const document = await open(page.file);
        if (localSignal.aborted || destroyed) return;
        const source = await document.getPage(page.page);
        if (localSignal.aborted || destroyed) {
          source.cleanup();
          return;
        }
        const raw = source.getViewport({
          scale: 1,
          rotation: source.rotate + page.rotation,
        });
        const viewport = source.getViewport({
          scale: Math.min(160 / raw.width, 180 / raw.height),
          rotation: source.rotate + page.rotation,
        });
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) {
          source.cleanup();
          throw new Error('페이지 미리보기를 표시할 수 없습니다.');
        }
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const task = source.render({
          canvas,
          canvasContext: context,
          viewport,
        });
        const cancel = () => task.cancel();
        localSignal.addEventListener('abort', cancel, { once: true });
        try {
          await task.promise;
        } finally {
          localSignal.removeEventListener('abort', cancel);
          source.cleanup();
        }
      });
      queue = action.catch(() => {});
      return action;
    }
    return { pages, render, destroy };
  } catch (cause) {
    await destroy();
    throw cause;
  }
}
