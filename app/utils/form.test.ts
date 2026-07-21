import { vi, describe, expect, test } from 'vitest';
import z from 'zod';
import { validateForm } from './form';

vi.mock('./csrf', () => ({
  csrf: {
    validate: () => Promise.resolve(),
  },
}));

const schema = z.object({
  name: z.string(),
  email: z.email(),
});

describe('validateForm', () => {
  test('should validate form data successfully', async () => {
    const formData = new FormData();
    formData.append('name', 'John Doe');
    formData.append('email', 'john.doe@example.com');

    const request = new Request('http://example.com', {
      method: 'POST',
      body: formData,
    });

    const result = await validateForm(request, schema);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data).toEqual({
        name: 'John Doe',
        email: 'john.doe@example.com',
      });
    }
  });

  test('should return validation error on invalid email', async () => {
    const formData = new FormData();
    formData.append('name', 'John Doe');
    formData.append('email', 'invalid-email');

    const request = new Request('http://example.com', {
      method: 'POST',
      body: formData,
    });

    const result = await validateForm(request, schema);

    expect(result.ok).toBe(false);
  });

  test('should derive booleans from schema', async () => {
    const boolSchema = z.object({
      newsletter: z.boolean(),
    });

    const formData = new FormData();
    formData.append('newsletter', 'on');

    const request = new Request('http://example.com', {
      method: 'POST',
      body: formData,
    });

    const result = await validateForm(request, boolSchema);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data).toEqual({ newsletter: true });
    }
  });

  test('should derive numbers from schema', async () => {
    const numSchema = z.object({
      age: z.number(),
    });

    const formData = new FormData();
    formData.append('age', '42');

    const request = new Request('http://example.com', {
      method: 'POST',
      body: formData,
    });

    const result = await validateForm(request, numSchema);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data).toEqual({ age: 42 });
    }
  });

  test('should derive types from optional/wrapped fields', async () => {
    const wrappedSchema = z.object({
      opt: z.boolean().optional(),
      def: z.number().default(0),
    });

    const formData = new FormData();
    formData.append('opt', 'on');
    formData.append('def', '7');

    const request = new Request('http://example.com', {
      method: 'POST',
      body: formData,
    });

    const result = await validateForm(request, wrappedSchema);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.data).toEqual({ opt: true, def: 7 });
    }
  });
});
