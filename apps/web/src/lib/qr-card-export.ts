import {
  printPalette,
  printTextLines,
  printableColor,
} from '@/lib/print-palette';

/** Local vector artwork; QR geometry comes from the same generator as the preview. */
export function qrCardSvg({
  name,
  text,
  color,
  template,
  qr,
  logo,
  subtitle = 'A LITTLE TIME FOR YOU',
}: {
  name: string;
  text: string;
  color: string;
  template: string;
  qr: string;
  logo?: string;
  subtitle?: string;
}) {
  const safe = (value: string) =>
    value.replace(
      /[<>&"']/g,
      (character) =>
        ({
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          '"': '&quot;',
          "'": '&apos;',
        })[character] || character,
    );
  const nameLines = printTextLines(name, 32, 'Georgia');
  const displayLines = printTextLines(text, 24, 'Arial');
  const poster = template === 'Minimal poster';
  const nameY = poster ? 116 : 104;
  const subtitleY = nameY + nameLines.length * 34 + 4;
  const subtitleLines = printTextLines(subtitle, 14, 'Arial');
  const qrY = subtitleY + subtitleLines.length * 18 + 10;
  const displayY = qrY + 240 + 42;
  const supportY = displayY + displayLines.length * 28 + 6;
  const footerY = supportY + 74;
  const height = footerY + 36;
  const label = (lines: string[], y: number, spacing: number) =>
    lines
      .map(
        (line, index) =>
          `<tspan x="210" y="${y + index * spacing}">${safe(line)}</tspan>`,
      )
      .join('');
  const qrViewBox = qr.match(/viewBox="([^"]+)"/)?.[1] || '0 0 33 33';
  const geometry = qr.replace(/^.*?<svg[^>]*>/s, '').replace(/<\/svg>\s*$/, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="${height}" viewBox="0 0 420 ${height}" data-layout="${safe(template)}"><rect width="420" height="${height}" rx="${poster ? 0 : 16}" fill="${printPalette.paper}"/>${poster ? '' : `<path d="M16 3H404" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`}${logo && /^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(logo) ? `<image href="${logo}" x="170" y="18" width="80" height="54" preserveAspectRatio="xMidYMid meet"/>` : `<g transform="translate(194 ${poster ? 42 : 30}) scale(1.4)" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z"/><path d="M2 22c0-6 4-10 10-12"/></g>`}<text text-anchor="middle" font-family="Georgia" font-size="32" fill="${printableColor(color)}">${label(nameLines, nameY, 34)}</text><text text-anchor="middle" font-family="Arial" font-size="24" fill="${printPalette.ink}">${label(displayLines, displayY, 28)}</text><text text-anchor="middle" font-family="Arial" font-size="14" fill="${printPalette.muted}">${label(subtitleLines, subtitleY, 18)}</text><svg x="90" y="${qrY}" width="240" height="240" viewBox="${qrViewBox}">${geometry}</svg><text text-anchor="middle" font-family="Arial" font-size="16" fill="${printPalette.muted}">${label(['Scan to share an honest review', 'or send us private feedback.'], supportY, 23)}</text><text x="210" y="${footerY}" text-anchor="middle" font-family="Arial" font-size="14" fill="${printPalette.muted}">a little ping, powered by RevuPing</text></svg>`;
}
