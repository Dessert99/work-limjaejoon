import { paperTheme } from '@/lib/styles/tokens';
import * as styles from './workspace.css';

type Props = {
  target: number;
  targetSize: string;
  lossless: boolean;
  disabled: boolean;
  onTargetChange: (value: number) => void;
};

/** 원본 크기는 유지하며 PNG에는 달성할 수 없는 목표 슬라이더를 노출하지 않는다. */
export default function ImageSettings({
  target,
  targetSize,
  lossless,
  disabled,
  onTargetChange,
}: Props) {
  return (
    <div className={styles.settings}>
      {lossless ? (
        <span className={styles.lossless}>PNG · 무손실 압축</span>
      ) : (
        <label className={styles.targetField}>
          <span className={styles.targetHeading}>
            용량 감소 목표{' '}
            <output className={styles.targetValue}>{target}%</output>
          </span>
          <input
            type='range'
            min={0}
            max={99}
            step={1}
            value={target}
            disabled={disabled}
            aria-label='용량 감소 목표'
            aria-valuetext={`${target}% 감소 목표`}
            className={styles.targetRange}
            style={{
              background: `linear-gradient(to right, ${paperTheme.rangeFill} ${(target / 99) * 100}%, ${paperTheme.rangeTrack} ${(target / 99) * 100}%)`,
            }}
            onChange={(event) => onTargetChange(Number(event.target.value))}
          />
          <span className={styles.targetHint}>
            <span>0%</span>
            <span>
              {disabled ? '이미지 확인 중' : `목표 용량 ${targetSize}`}
            </span>
            <span>99%</span>
          </span>
        </label>
      )}
    </div>
  );
}
