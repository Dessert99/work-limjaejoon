import { globalStyle, style } from '@vanilla-extract/css';
import { colors } from '@/lib/styles/tokens';

globalStyle('body', {
  margin: 0,
  background: colors.background,
  color: colors.foreground,
  fontFamily: 'Arial, sans-serif',
});
globalStyle('*', { boxSizing: 'border-box' });

/** 미리보기 설명과 장면의 폭을 제한한다. */
export const page = style({
  maxWidth: 1120,
  margin: '0 auto',
  padding: '32px 24px',
});
/** 제목과 재생 조작을 배치한다. */
export const header = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 20,
  flexWrap: 'wrap',
});
/** 장면이 로딩되기 전에도 일정한 공간을 확보한다. */
export const stage = style({
  height: 'min(72vh, 740px)',
  minHeight: 360,
  position: 'relative',
  overflow: 'hidden',
  borderRadius: 24,
});
/** 대체 이미지를 장면과 같은 크기로 보여준다. */
export const poster = style({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
});
/** 버튼의 포커스와 대비를 보장한다. */
export const button = style({
  border: 0,
  borderRadius: 999,
  padding: '12px 22px',
  background: colors.foreground,
  color: 'white',
  font: 'inherit',
  cursor: 'pointer',
  ':disabled': { opacity: 0.4, cursor: 'default' },
  ':focus-visible': { outline: `3px solid ${colors.gold}`, outlineOffset: 4 },
});
/** 안내 문구의 대비를 유지한다. */
export const note = style({
  color: colors.muted,
  lineHeight: 1.6,
  fontSize: 14,
});
