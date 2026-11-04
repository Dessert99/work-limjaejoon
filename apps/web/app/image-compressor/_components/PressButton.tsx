'use client';
import { useState, type ButtonHTMLAttributes } from 'react';
import * as styles from './workspace.css';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { round?: boolean };

/** 포인터와 키보드로 누르는 동안에만 입체 버튼이 들어간다. */
export default function PressButton({
  children,
  round = false,
  disabled,
  ...props
}: Props) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      {...props}
      type='button'
      disabled={disabled}
      className={`${styles.button} ${round ? styles.roundButton : ''}`}
      data-pressed={pressed && !disabled}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') setPressed(true);
      }}
      onKeyUp={() => setPressed(false)}
      onBlur={() => setPressed(false)}>
      <span className={styles.buttonOuter}>
        <span className={styles.buttonInner}>
          <span className={styles.buttonLabel}>{children}</span>
        </span>
      </span>
    </button>
  );
}
