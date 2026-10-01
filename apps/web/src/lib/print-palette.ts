/** Print colors are deliberately independent of the surrounding app theme. */
export const printPalette = {
  paper: '#ffffff',
  ink: '#20243c',
  muted: '#535768',
  border: '#dddcd6',
} as const;
export function printableColor(color: string) {
  if (!/^#[\da-f]{6}$/i.test(color)) return printPalette.ink;
  const channels = [1, 3, 5].map((offset) => {
    const value = parseInt(color.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance =
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return 1.05 / (luminance + 0.05) >= 4.5 ? color : printPalette.ink;
}

export function printTextLines(
  value: string,
  fontSize: number,
  family: string,
) {
  const context = document.createElement('canvas').getContext('2d');
  if (!context) return [value];
  context.font = `${fontSize}px ${family}`;
  const lines: string[] = [];
  let line = '';
  for (const word of value.trim().split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= 340) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = '';
    for (const character of word) {
      if (line && context.measureText(line + character).width > 340) {
        lines.push(line);
        line = '';
      }
      line += character;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}
