import { style } from '@vanilla-extract/css';
import { paperTheme } from '@/lib/styles/tokens';

/** 종이 작업대 색상으로 화면을 채우고 모바일 여백을 확보한다. */
export const page = style({
  minHeight: '100dvh',
  margin: -8,
  padding: '36px 20px 64px',
  boxSizing: 'border-box',
  background: paperTheme.desk,
  color: paperTheme.ink,
  fontFamily: paperTheme.bodyFont,
  lineHeight: 1.7,
});
/** 긴 입력창도 읽기 편한 폭으로 제한한다. */
export const content = style({ maxWidth: 960, margin: '0 auto' });
/** 다른 도구와 동일하게 정적 홈 링크를 제공한다. */
export const home = style({ color: paperTheme.ink, textUnderlineOffset: 4 });
/** 부분 글꼴에 없는 글자도 기본 시스템 글꼴로 선명하게 표시한다. */
export const title = style({
  margin: '24px 0 8px',
  fontSize: 'clamp(28px, 4vw, 40px)',
  color: paperTheme.title,
});
/** 글 입력과 계산 결과를 종이 한 장에 모은다. */
export const workspace = style({
  marginTop: 28,
  padding: 'clamp(16px, 3vw, 28px)',
  background: paperTheme.paper,
  borderRadius: 12,
  boxShadow: `0 8px 30px rgba(${paperTheme.shadowRgb}, 0.12)`,
});
/** 입력창에 화면에 보이는 이름을 붙인다. */
export const label = style({
  display: 'block',
  marginBottom: 8,
  fontWeight: 700,
});
/** 확대와 키보드 조작에 맞춰 입력 영역 크기와 포커스를 유지한다. */
export const textarea = style({
  display: 'block',
  width: '100%',
  minHeight: 280,
  padding: 14,
  boxSizing: 'border-box',
  border: `1px solid ${paperTheme.rangeThumbBorder}`,
  borderRadius: 6,
  background: paperTheme.paper,
  color: paperTheme.ink,
  font: 'inherit',
  resize: 'vertical',
  ':focus-visible': {
    outline: `2px solid ${paperTheme.rangeFill}`,
    outlineOffset: 3,
  },
});
/** 작은 화면에서는 두 열로 줄여 계산 결과가 넘치지 않게 한다. */
export const metrics = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 12,
  margin: '24px 0 16px',
  '@media': {
    '(max-width: 620px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
  },
});
/** 계산 기준별 숫자를 가까이 배치한다. */
export const metric = style({
  padding: '12px 10px',
  background: paperTheme.settingsPaper,
  borderRadius: 6,
});
/** 숫자가 길어져도 계산 결과 칸을 벗어나지 않게 한다. */
export const value = style({
  margin: '4px 0 0',
  fontSize: 24,
  fontWeight: 700,
  overflowWrap: 'anywhere',
  fontVariantNumeric: 'tabular-nums',
});
/** 단위를 숫자보다 작게 표시한다. */
export const unit = style({ fontSize: 13, fontWeight: 400 });
/** 임시 저장 상태를 입력 영역 아래에 안내한다. */
export const note = style({ marginBottom: 0, fontSize: 14 });
/** 계산 기준과 사용법을 검색 가능한 정적 문장으로 제공한다. */
export const help = style({ marginTop: 32, fontSize: 15 });
