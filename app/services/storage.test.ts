// @vitest-environment node

import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { deleteObjects, getObject, putObject } from './storage';

describe('storage', () => {
  it('stores an object and reads it back', async () => {
    const key = `test/${randomUUID()}`;

    await putObject({
      key,
      body: new TextEncoder().encode('hello'),
      contentType: 'text/plain',
    });

    const body = await getObject(key);
    expect(new TextDecoder().decode(body)).toBe('hello');
  });

  it('returns undefined for a key that does not exist', async () => {
    expect(await getObject(`test/${randomUUID()}`)).toBeUndefined();
  });

  it('deletes objects, missing ones included', async () => {
    const key = `test/${randomUUID()}`;
    await putObject({
      key,
      body: new TextEncoder().encode('hello'),
      contentType: 'text/plain',
    });

    await deleteObjects([key, `test/${randomUUID()}`]);

    expect(await getObject(key)).toBeUndefined();
  });
});
