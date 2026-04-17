/**
 * S3 storage layer — media attachments and CSV exports.
 *
 * Required env vars:
 *   S3_BUCKET_NAME   e.g. sakura-srs-dev-media
 *   AWS_REGION       e.g. us-east-1
 *
 * Pre-signed URLs expire after 1 hour.
 * When S3_BUCKET_NAME is not set, upload/presign operations return null.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const REGION = process.env.AWS_REGION ?? 'us-east-1';
const BUCKET = process.env.S3_BUCKET_NAME;
const PRESIGN_EXPIRY = 3600; // 1 hour

let _s3: S3Client | null = null;
function getS3(): S3Client | null {
  if (!BUCKET) return null;
  if (!_s3) _s3 = new S3Client({ region: REGION });
  return _s3;
}

/**
 * Upload a CSV export to S3 and return a pre-signed download URL.
 * Returns null when S3 is not configured (file is served inline instead).
 */
export async function uploadExport(
  userId: string,
  filename: string,
  csvContent: string
): Promise<string | null> {
  const client = getS3();
  if (!client || !BUCKET) return null;

  const key = `exports/${userId}/${filename}`;
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: csvContent,
      ContentType: 'text/csv',
      ServerSideEncryption: 'AES256',
    })
  );

  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: PRESIGN_EXPIRY }
  );
}

/**
 * Generate a pre-signed GET URL for an existing S3 object.
 */
export async function getPresignedUrl(key: string): Promise<string | null> {
  const client = getS3();
  if (!client || !BUCKET) return null;
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: PRESIGN_EXPIRY }
  );
}
