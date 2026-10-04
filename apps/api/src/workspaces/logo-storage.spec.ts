import sharp from 'sharp';
import { sanitizeLogo, MAX_LOGO_BYTES } from './logo-storage.service';
describe('logo validation', () => {
  it('rejects unsupported content, empty files, oversize and decoded dimensions', async () => {
    for (const file of [
      Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
      Buffer.alloc(0),
      Buffer.alloc(MAX_LOGO_BYTES + 1),
      Buffer.from('not a jpeg'),
    ])
      await expect(sanitizeLogo(file)).rejects.toThrow();
    const wide = await sharp({
      create: { width: 4097, height: 1, channels: 3, background: 'red' },
    })
      .png()
      .toBuffer();
    await expect(sanitizeLogo(wide)).rejects.toThrow();
  });
  it('decodes raster content and emits bounded metadata-free WebP', async () => {
    const original = await sharp({
      create: { width: 1600, height: 800, channels: 3, background: '#7856ff' },
    })
      .withMetadata()
      .jpeg()
      .toBuffer();
    const result = await sanitizeLogo(original);
    const metadata = await sharp(result).metadata();
    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBe(1024);
    expect(metadata.exif).toBeUndefined();
    expect(metadata.icc).toBeUndefined();
  });
});
