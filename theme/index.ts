export const darkTheme = {
  bg0: '#020A14',
  bg1: '#0B1929',
  bg2: '#0F2138',
  bg3: '#172A46',
  bg4: '#1E3560',
  border: '#1F3755',
  border2: '#264568',
  text1: '#F0F8FF',
  text2: '#B8D5F0',
  text3: '#5A7FA0',
  text4: '#1E3555',
  teal: '#00E5C8',
  tealDark: '#009A88',
  gold: '#C9A84C',
  goldLight: '#E8C870',
  red: '#FF4C2E',
  purple: '#8B6FFF',
  green: '#00C050',
  amber: '#FF7850',
  surface: '#030E1A',
};

export const lightTheme = {
  bg0: '#F4F8FC',
  bg1: '#FFFFFF',
  bg2: '#EDF3FA',
  bg3: '#DDE9F5',
  bg4: '#CCDDEf',
  border: '#C2D5EA',
  border2: '#AFC5DD',
  text1: '#08111E',
  text2: '#1A3050',
  text3: '#407090',
  text4: '#8AACC8',
  teal: '#006A5E',
  tealDark: '#004E46',
  gold: '#8A6010',
  goldLight: '#A07820',
  red: '#C02010',
  purple: '#5030BB',
  green: '#005A28',
  amber: '#B04010',
  surface: '#EAF1F9',
};

export type Theme = typeof darkTheme;

export const typography = {
  hero:       { fontSize: 32, fontWeight: '900' as const, letterSpacing: -1.5 },
  display:    { fontSize: 26, fontWeight: '900' as const, letterSpacing: -0.7 },
  title:      { fontSize: 22, fontWeight: '900' as const, letterSpacing: -0.5 },
  heading:    { fontSize: 17, fontWeight: '800' as const, letterSpacing: -0.3 },
  subheading: { fontSize: 15, fontWeight: '700' as const, letterSpacing: -0.2 },
  body:       { fontSize: 13, fontWeight: '400' as const, lineHeight: 20 },
  bodyMedium: { fontSize: 13, fontWeight: '600' as const, lineHeight: 20 },
  caption:    { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.2 },
  label:      { fontSize: 10, fontWeight: '800' as const, letterSpacing: 1.0 },
  micro:      { fontSize: 9,  fontWeight: '700' as const, letterSpacing: 0.6 },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };
export const radius  = { sm: 10, md: 14, lg: 18, xl: 22, pill: 50 };
