import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getConfig } from '~/config';

const config = getConfig();

const client = new S3Client({
  endpoint: config.storage.endpoint,
  region: config.storage.region,
  forcePathStyle: true,
  credentials: {
    accessKeyId: config.storage.accessKeyId,
    secretAccessKey: config.storage.secretAccessKey,
  },
  // The SDK checksums every request by default in a way not every
  // S3-compatible store understands; only send one where S3 requires it.
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

export interface PutObjectInput {
  key: string;
  body: Uint8Array;
  contentType: string;
}

export async function putObject(input: PutObjectInput) {
  await client.send(new PutObjectCommand({
    Bucket: config.storage.bucket,
    Key: input.key,
    Body: input.body,
    ContentType: input.contentType,
  }));
}

/** The object's content as a stream, or `undefined` when there is none. */
export async function getObjectStream(key: string) {
  try {
    const object = await client.send(new GetObjectCommand({
      Bucket: config.storage.bucket,
      Key: key,
    }));

    return object.Body?.transformToWebStream();
  }
  catch (error) {
    if (error instanceof NoSuchKey) {
      return undefined;
    }

    throw error;
  }
}

/** Copies an object within the bucket, content type included. */
export async function copyObject(fromKey: string, toKey: string) {
  await client.send(new CopyObjectCommand({
    Bucket: config.storage.bucket,
    CopySource: `${config.storage.bucket}/${fromKey}`,
    Key: toKey,
  }));
}

/** Deleting a key that does not exist is not an error. */
export async function deleteObjects(keys: string[]) {
  for (const key of keys) {
    await client.send(new DeleteObjectCommand({
      Bucket: config.storage.bucket,
      Key: key,
    }));
  }
}
