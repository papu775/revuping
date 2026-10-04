import {
  Inject,
  Injectable,
  ServiceUnavailableException,
  BadRequestException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  PutPublicAccessBlockCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { API_ENVIRONMENT, type ApiEnvironment } from '../config/environment';
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;
export async function sanitizeLogo(buffer: Buffer): Promise<Buffer> {
  if (!buffer.length || buffer.length > MAX_LOGO_BYTES)
    throw new BadRequestException();
  try {
    const image = sharp(buffer, {
      limitInputPixels: 4096 * 4096,
      failOn: 'warning',
    });
    const meta = await image.metadata();
    if (
      !['png', 'jpeg', 'webp'].includes(meta.format ?? '') ||
      !meta.width ||
      !meta.height ||
      meta.width > 4096 ||
      meta.height > 4096 ||
      (meta.pages ?? 1) !== 1
    )
      throw new Error('Invalid raster');
    return await image
      .rotate()
      .resize({
        width: 1024,
        height: 1024,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    throw new BadRequestException();
  }
}
@Injectable()
export class LogoStorage {
  readonly client: S3Client;
  private ready?: Promise<void>;
  constructor(@Inject(API_ENVIRONMENT) private readonly env: ApiEnvironment) {
    const local = env.S3_LOCAL_EMULATOR === 'true';
    this.client = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      forcePathStyle: env.S3_FORCE_PATH_STYLE === 'true',
      maxAttempts: 2,
      credentials: local
        ? { accessKeyId: 'test', secretAccessKey: 'test' }
        : env.S3_ACCESS_KEY_ID
          ? {
              accessKeyId: env.S3_ACCESS_KEY_ID,
              secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
            }
          : undefined,
    });
  }
  private async send(operation: () => Promise<unknown>) {
    try {
      return await operation();
    } catch {
      throw new ServiceUnavailableException();
    }
  }
  private async bucket() {
    if (this.env.S3_LOCAL_EMULATOR !== 'true') return;
    this.ready ??= (async () => {
      try {
        await this.client.send(
          new HeadBucketCommand({ Bucket: this.env.S3_BUCKET }),
          { abortSignal: AbortSignal.timeout(5000) },
        );
      } catch (error) {
        if (
          (error as { $metadata?: { httpStatusCode?: number } }).$metadata
            ?.httpStatusCode !== 404
        )
          throw error;
        await this.send(() =>
          this.client.send(
            new CreateBucketCommand({ Bucket: this.env.S3_BUCKET }),
            { abortSignal: AbortSignal.timeout(5000) },
          ),
        );
      }
      await this.send(() =>
        this.client.send(
          new PutPublicAccessBlockCommand({
            Bucket: this.env.S3_BUCKET,
            PublicAccessBlockConfiguration: {
              BlockPublicAcls: true,
              IgnorePublicAcls: true,
              BlockPublicPolicy: true,
              RestrictPublicBuckets: true,
            },
          }),
          { abortSignal: AbortSignal.timeout(5000) },
        ),
      );
    })().catch(() => {
      this.ready = undefined;
      throw new ServiceUnavailableException();
    });
    await this.ready;
  }
  async put(key: string, body: Buffer) {
    await this.bucket();
    await this.send(() =>
      this.client.send(
        new PutObjectCommand({
          Bucket: this.env.S3_BUCKET,
          Key: key,
          Body: body,
          ContentType: 'image/webp',
        }),
        { abortSignal: AbortSignal.timeout(5000) },
      ),
    );
  }
  async read(key: string): Promise<Buffer> {
    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.env.S3_BUCKET, Key: key }),
        { abortSignal: AbortSignal.timeout(5000) },
      );
      if (!result.Body) throw new Error('Missing body');
      return Buffer.from(await result.Body.transformToByteArray());
    } catch {
      throw new ServiceUnavailableException();
    }
  }
  async remove(key: string) {
    await this.send(() =>
      this.client.send(
        new DeleteObjectCommand({ Bucket: this.env.S3_BUCKET, Key: key }),
        { abortSignal: AbortSignal.timeout(5000) },
      ),
    );
  }
}
