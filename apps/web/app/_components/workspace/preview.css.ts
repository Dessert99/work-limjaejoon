import { globalStyle, style } from '@vanilla-extract/css';
import { colors } from '@/lib/styles/tokens';

globalStyle('body', {
  margin: 0,
  background: colors.background,
  color: colors.foreground,
  fontFamily: 'Arial, sans-serif',
});
globalStyle('*', { boxSizing: 'border-box' });

/** 방이 브라우저의 전체 화면을 차지하게 한다. */
export const page = style({
  width: '100%',
  height: '100svh',
  position: 'relative',
  overflow: 'hidden',
});
/** 로딩 전후에도 방의 화면 크기를 유지한다. */
export const stage = style({ position: 'absolute', inset: 0 });
/** 로딩이 끝나기 전에는 준비 중인 장면을 공개하지 않는다. */
export const preparingStage = style([stage, { visibility: 'hidden' }]);
/** 화면을 덮지 않고 제목과 상태를 보조 기술에 전달한다. */
export const srOnly = style({
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
});
/** 안내 문구의 대비를 유지한다. */
export const note = style({
  color: colors.muted,
  lineHeight: 1.6,
  fontSize: 14,
});

/** 기능명을 Canvas 위에 표시하되 장면 조작을 가로채지 않는다. */
export const labels = style({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
});
/** 장면과 HTML의 좌표계를 맞춘다. */
export const labelHost = style({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
});
/** 기능명은 모델 로딩 후 각 도구 아래에 표시한다. */
export const toolLabel = style({
  position: 'absolute',
  top: 0,
  left: 0,
  opacity: 0,
  width: 'max-content',
  maxWidth: 88,
  whiteSpace: 'normal',
  wordBreak: 'keep-all',
  overflowWrap: 'normal',
  textAlign: 'center',
  color: '#fff',
  fontSize: 13,
  fontWeight: 400,
  lineHeight: 1.35,
  textShadow: '0 1px 4px #000',
  padding: '3px 6px',
  background: 'rgba(15, 23, 40, 0.65)',
  borderRadius: 6,
});

/** 정적 HTML의 도구 링크를 장면 위에서도 직접 선택할 수 있게 한다. */
export const toolLink = style({
  cursor: 'pointer',
  pointerEvents: 'auto',
  textDecoration: 'none',
  ':focus-visible': { outline: `2px solid ${colors.gold}`, outlineOffset: 3 },
});
