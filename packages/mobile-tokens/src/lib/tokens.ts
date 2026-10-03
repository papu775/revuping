export const lightColors = {
  canvas: '#faf8f3',
  surface: '#ffffff',
  surfaceSection: '#f1efe8',
  surfaceSelected: '#f0ebf8',
  surfaceInput: '#ffffff',
  ink: '#20243c',
  muted: '#535768',
  border: '#dddcd6',
  accentLine: '#c9b9e6',
  violet: '#6b52b9',
  violetDark: '#574098',
  actionBg: '#6b52b9',
  actionHover: '#574098',
  onDark: '#f8f6fc',
  mint: '#e5f0e8',
  positiveInk: '#3e644e',
  positiveLine: '#c7dbcc',
  warm: '#f5eadd',
  warmInk: '#816334',
  danger: '#a43743',
  dangerSoft: '#fff0f0',
  chartSage: '#719579',
  controlBorder: '#b8bbca',
  disabledBg: '#eeece6',
  disabledInk: '#8b8991',
  disabledLine: '#dddcd6',
  overlay: '#171a28a8',
} as const;

export const darkColors = {
  canvas: '#121521',
  surface: '#222739',
  surfaceSection: '#1a1f2e',
  surfaceSelected: '#392f50',
  surfaceInput: '#181d2a',
  ink: '#f0edf6',
  muted: '#c0c3d2',
  border: '#3d4559',
  accentLine: '#6c548f',
  violet: '#c4a9f5',
  violetDark: '#ae8de6',
  actionBg: '#7851c1',
  actionHover: '#8961d1',
  onDark: '#faf7ff',
  mint: '#263c34',
  positiveInk: '#acd5bb',
  positiveLine: '#476957',
  warm: '#403529',
  warmInk: '#e5bd79',
  danger: '#f5a5ad',
  dangerSoft: '#422a32',
  chartSage: '#8db89b',
  controlBorder: '#707b91',
  disabledBg: '#202433',
  disabledInk: '#7b8397',
  disabledLine: '#363c4d',
  overlay: '#05070ec0',
} as const;

export type ThemeColors = Record<keyof typeof lightColors, string>;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const typography = {
  caption: 13,
  label: 15,
  body: 15,
  heading: 22,
  title: 28,
  large: 36,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const avatarTones = {
  peach: '#f5eadd',
  lavender: '#f0ebf8',
  sage: '#e5f0e8',
  sky: '#e0ecf5',
  rose: '#f5e0e8',
} as const;

export type AvatarTone = keyof typeof avatarTones;

export const statusMeanings = {
  new: { label: 'New', color: 'violet' },
  needsCare: { label: 'Needs a little care', color: 'warm' },
  resolved: { label: 'Resolved', color: 'mint' },
  open: { label: 'Open', color: 'violet' },
  inProgress: { label: 'In progress', color: 'warm' },
  scheduled: { label: 'Scheduled', color: 'violet' },
  draft: { label: 'Draft', color: 'muted' },
  paused: { label: 'Paused', color: 'warm' },
  completed: { label: 'Completed', color: 'mint' },
  active: { label: 'Active', color: 'mint' },
  disconnected: { label: 'Disconnected', color: 'muted' },
  demoConnected: { label: 'Demo connected', color: 'mint' },
} as const;

export type StatusKey = keyof typeof statusMeanings;
