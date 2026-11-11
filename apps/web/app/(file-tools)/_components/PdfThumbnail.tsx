'use client';
import { useEffect, useRef, useState } from 'react';
import type { PdfPreview } from '@/domains/file-tools/lib/pdf-preview';
import type { PdfPage } from '@/domains/file-tools/model/file-tools';
import * as styles from './tools.css';

type Props = { preview: PdfPreview; page: PdfPage; name: string };

/** 보이는 작은 Canvas만 유지하고 화면 밖 페이지의 픽셀 메모리는 해제한다. */
export default function PdfThumbnail({ preview, page, name }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState<PdfPage | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      if (!entry.isIntersecting) setRendered(null);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const node = canvas.current;
    if (!node || !visible) return;
    const task = new AbortController();
    void preview
      .render(page, node, task.signal)
      .then(() => {
        if (!task.signal.aborted) {
          setRendered(page);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!task.signal.aborted) setFailed(true);
      });
    return () => {
      task.abort();
      node.width = 0;
      node.height = 0;
    };
  }, [preview, page, visible]);
  return (
    <div
      ref={host}
      className={styles.thumbnailFrame}>
      <canvas
        ref={canvas}
        width={0}
        height={0}
        role='img'
        className={styles.canvas}
        aria-label={`${name} ${page.page}페이지 미리보기`}
        data-pdf-thumbnail
        data-ready={rendered === page && visible}
      />
      {failed && <span>미리보기를 표시하지 못했습니다.</span>}
    </div>
  );
}
