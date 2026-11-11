'use client';
import { useRef } from 'react';
import { formatBytes } from '@/domains/file-tools/lib/validate-files';
import * as styles from './tools.css';

type Props = {
  files: File[];
  disabled: boolean;
  onChange: (files: File[]) => void;
};

/** 드래그와 키보드 버튼으로 같은 파일 순서를 만들 수 있게 한다. */
export default function FileList({ files, disabled, onChange }: Props) {
  const dragged = useRef<number | null>(null);
  function move(from: number, to: number) {
    if (disabled || from < 0 || to < 0 || to >= files.length || from === to)
      return;
    const next = [...files];
    next.splice(to, 0, next.splice(from, 1)[0]);
    onChange(next);
  }
  return (
    <ol aria-label='선택한 파일 순서'>
      {files.map((file, index) => (
        <li
          key={`${file.name}-${file.lastModified}-${index}`}
          className={styles.item}
          draggable={!disabled}
          onDragStart={(event) => {
            event.dataTransfer.setData('text/plain', String(index));
            dragged.current = index;
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            if (event.dataTransfer.files.length) return;
            event.stopPropagation();
            if (dragged.current !== null) move(dragged.current, index);
            dragged.current = null;
          }}>
          <span className={styles.filename}>
            {index + 1}. {file.name} ({formatBytes(file.size)})
          </span>
          <button
            type='button'
            className={styles.button}
            disabled={disabled || index === 0}
            onClick={() => move(index, index - 1)}
            aria-label={`${file.name} 앞으로 이동`}>
            ↑
          </button>
          <button
            type='button'
            className={styles.button}
            disabled={disabled || index === files.length - 1}
            onClick={() => move(index, index + 1)}
            aria-label={`${file.name} 뒤로 이동`}>
            ↓
          </button>
          <button
            type='button'
            className={styles.button}
            disabled={disabled}
            onClick={() => onChange(files.filter((_, i) => i !== index))}
            aria-label={`${file.name} 제거`}>
            제거
          </button>
        </li>
      ))}
    </ol>
  );
}
