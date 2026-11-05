import { style } from '@vanilla-extract/css';
import { colors } from '@/lib/styles/tokens';

/** 화면 중앙의 로딩과 오류 표시를 위한 배경이다. */
export const loadingScreen = style({
  position: 'absolute',
  inset: 0,
  zIndex: 3,
  display: 'grid',
  placeItems: 'center',
  background: colors.loadingBackground,
  color: colors.loadingText,
  padding: 24,
  textAlign: 'center',
});
/** 가방 위에 짧은 로딩 문구만 표시한다. */
export const loadingText = style({
  margin: '0 0 22px',
  font: '13px/20px Arial, sans-serif',
  letterSpacing: '.08em',
});
/** 위에서 본 가방의 비율과 지퍼 손잡이 공간을 확보한다. */
export const loadingBag = style({
  display: 'block',
  width: 240,
  height: 54,
  maxWidth: '100%',
});
