import { businessBrand } from './brand';
const luminance = (color: string) => {
  const c = [1, 3, 5].map((i) => {
    const n = parseInt(color.slice(i, i + 2), 16) / 255;
    return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  });
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
};
it('keeps business accent text above WCAG AA contrast across the RGB range', () => {
  for (let r = 0; r <= 255; r += 17)
    for (let g = 0; g <= 255; g += 17)
      for (let b = 0; b <= 255; b += 17) {
        const color =
          '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
        const brand = businessBrand(color);
        const l = [luminance(color), luminance(brand.foreground)].sort(
          (a, b) => a - b,
        );
        expect((l[1] + 0.05) / (l[0] + 0.05)).toBeGreaterThanOrEqual(4.5);
      }
});
