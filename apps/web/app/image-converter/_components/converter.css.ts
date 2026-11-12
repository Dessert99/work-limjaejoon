import { style } from '@vanilla-extract/css';
import { paperTheme } from '@/lib/styles/tokens';

/** 기존 압축 화면과 같은 종이 색상으로 별도 변환 작업대를 제공한다. */
export const page = style({
  minHeight: 'calc(100svh - var(--site-header-height))',
  padding: '36px 20px 64px',
  boxSizing: 'border-box',
  background: paperTheme.desk,
  color: paperTheme.ink,
  fontFamily: paperTheme.bodyFont,
  lineHeight: 1.7,
});
/** 넓은 화면에서도 입력과 결과를 한눈에 비교할 수 있게 한다. */
export const content = style({ maxWidth: 1000, margin: '0 auto' });
/** 부분 글꼴에 의존하지 않아 새 제목 글자가 빠지지 않게 한다. */
export const title = style({
  fontSize: 'clamp(28px, 4vw, 40px)',
  color: paperTheme.title,
});
/** 파일과 설정을 한 작업 영역 안에 배치한다. */
export const workspace = style({
  margin: '28px 0',
  padding: 'clamp(16px, 3vw, 28px)',
  background: paperTheme.paper,
  borderRadius: 12,
});
/** 입력의 접근 가능한 이름과 간격을 유지한다. */
export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginBottom: 20,
  minWidth: 0,
});
/** 설정 입력은 화면 폭에 따라 줄바꿈한다. */
export const settings = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 20,
});
/** 모바일에서는 원본과 결과를 세로로 비교한다. */
export const previews = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 20,
  '@media': { '(max-width: 600px)': { gridTemplateColumns: '1fr' } },
});
/** 실제 결과 비율을 유지할 공간을 확보한다. */
export const print = style({
  margin: 0,
  padding: 14,
  border: `1px solid ${paperTheme.rangeThumbBorder}`,
  overflowWrap: 'anywhere',
});
/** 작은 미리보기도 원본을 자르지 않고 전체를 보여준다. */
export const image = style({
  display: 'block',
  width: '100%',
  height: 240,
  marginTop: 12,
  objectFit: 'contain',
});
/** 파일 다운로드 버튼은 작은 화면에서 줄바꿈한다. */
export const actions = style({ display: 'flex', flexWrap: 'wrap', gap: 12 });
/** 처리 중에는 오래된 결과를 다운로드하지 못하게 한다. */
export const button = style({
  padding: '10px 16px',
  border: `1px solid ${paperTheme.rangeThumbBorder}`,
  borderRadius: 6,
  background: paperTheme.buttonTop,
  color: paperTheme.buttonInk,
  cursor: 'pointer',
  font: 'inherit',
  ':disabled': { opacity: 0.5, cursor: 'default' },
  ':focus-visible': {
    outline: `2px solid ${paperTheme.rangeFill}`,
    outlineOffset: 3,
  },
});
