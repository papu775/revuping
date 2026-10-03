/** Content height excludes the device's bottom safe-area inset. */
export const bottomNavigationHeight = (fontScale: number) =>
  68 + Math.max(0, fontScale - 1) * 40;
