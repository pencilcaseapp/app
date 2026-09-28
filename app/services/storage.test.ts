// @vitest-environment node

import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  copyObject,
  deleteObjects,
  getObjectStream,
  putObject,
} from './storage';

async function read(stream: ReadableStream<Uint8Array>) {
  return new TextDecoder().decode(await new Response(stream).arrayBuffer());
}

describe('storage', () => {
  it('stores an object and streams it back', async () => {
    const key = `test/${randomUUID()}`;

    await putObject({
      key,
      body: new TextEncoder().encode('hello'),
      contentType: 'text/plain',
    });

    const stream = await getObjectStream(key);
    expect(await read(stream!)).toBe('hello');
  });

  it('copies an object to another key', async () => {
    const key = `test/${randomUUID()}`;
    const copyKey = `test/${randomUUID()}`;
    await putObject({
      key,
      body: new TextEncoder().encode('hello'),
      contentType: 'text/plain',
    });

    await copyObject(key, copyKey);

    const stream = await getObjectStream(copyKey);
    expect(await read(stream!)).toBe('hello');
  });

  it('returns undefined for a key that does not exist', async () => {
    expect(await getObjectStream(`test/${randomUUID()}`)).toBeUndefined();
  });

  it('deletes objects, missing ones included', async () => {
    const key = `test/${randomUUID()}`;
    await putObject({
      key,
      body: new TextEncoder().encode('hello'),
      contentType: 'text/plain',
    });

    await deleteObjects([key, `test/${randomUUID()}`]);

    expect(await getObjectStream(key)).toBeUndefined();
  });
});
