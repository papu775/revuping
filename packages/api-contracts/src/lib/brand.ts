// Small shared colour calculation for business surfaces; status colours stay global.
export function businessBrand(color: string) {
  const accent = /^#[0-9a-f]{6}$/i.test(color) ? color : '#7253bf';
  const rgb = [1, 3, 5].map((start) =>
    parseInt(accent.slice(start, start + 2), 16),
  );
  const linear = rgb.map((value) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance =
    linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  const foreground = luminance > 0.179 ? '#000000' : '#ffffff';
  // The selected/focus colour must also contrast on its surrounding theme surface.
  const lightFocus = luminance > 0.18 ? '#403452' : accent;
  const darkFocus = luminance < 0.3 ? '#ded3f7' : accent;
  return { accent, foreground, lightFocus, darkFocus };
}
