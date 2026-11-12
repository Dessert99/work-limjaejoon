import { globalStyle } from '@vanilla-extract/css';
import { colors, paperTheme, siteLayout } from '@/lib/styles/tokens';

globalStyle(':root', {
  vars: { '--site-header-height': siteLayout.headerHeight },
  '@media': {
    [siteLayout.compactMedia]: {
      vars: { '--site-header-height': siteLayout.compactHeaderHeight },
    },
  },
});
globalStyle('body', {
  margin: 0,
  background: colors.background,
  color: colors.foreground,
  fontFamily: paperTheme.bodyFont,
});
globalStyle('*', { boxSizing: 'border-box' });
