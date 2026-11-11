'use client';

import { useEffect, useState } from 'react';
import { countCharacters } from '@/domains/character-counter/lib/count-characters';
import * as styles from './counter.css';

const storageKey = 'work.character-counter.draft';

/** 입력한 글을 브라우저 안에 보관하고 글자 수를 즉시 갱신한다. */
export default function CharacterCounter() {
  const [text, setText] = useState('');
  const [storageNotice, setStorageNotice] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // 정적 HTML의 초기 렌더 뒤에 초안을 복원해 서버와 브라우저의 첫 화면을 일치시킨다.
    const timer = setTimeout(() => {
      try {
        const draft = localStorage.getItem(storageKey);
        if (draft !== null) setText(draft);
      } catch {
        setStorageNotice(
          '브라우저 저장소를 사용할 수 없어 임시 저장이 꺼져 있습니다.'
        );
      }
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  const counts = countCharacters(text);
  const metrics = [
    ['공백 포함', counts.characters, '자'],
    ['공백 제외', counts.withoutSpaces, '자'],
    ['EUC-KR 방식', counts.legacyBytes, 'byte'],
    ['UTF-8', counts.utf8Bytes, 'byte'],
  ] as const;
  return (
    <section
      className={styles.workspace}
      aria-label='글자 수 계산'>
      <label
        className={styles.label}
        htmlFor='character-text'>
        계산할 글
      </label>
      <textarea
        id='character-text'
        className={styles.textarea}
        value={text}
        disabled={!ready}
        spellCheck={false}
        placeholder='자소서나 과제 내용을 입력하세요.'
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          try {
            // 빈 글도 저장해 새로 열었을 때 지운 초안이 복원되는 일을 막는다.
            localStorage.setItem(storageKey, next);
            setStorageNotice('');
          } catch {
            setStorageNotice(
              '임시 저장에 실패했습니다. 창을 닫기 전에 글을 따로 보관하세요.'
            );
          }
        }}
      />
      <dl
        className={styles.metrics}
        aria-live='polite'
        aria-atomic='true'>
        {metrics.map(([label, value, unit]) => (
          <div
            key={label}
            className={styles.metric}>
            <dt>{label}</dt>
            <dd
              className={styles.value}
              data-count={label}>
              {value.toLocaleString('ko-KR')}{' '}
              <span className={styles.unit}>{unit}</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className={styles.note}>
        글은 이 브라우저에만 임시 저장됩니다. 공용 기기에서는 사용 후 입력한
        글을 지워 주세요.
      </p>
      {storageNotice && (
        <p
          role='status'
          className={styles.note}>
          {storageNotice}
        </p>
      )}
    </section>
  );
}
