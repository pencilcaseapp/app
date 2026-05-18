import { describe, expect, test } from 'vitest';
import z from 'zod';
import { validateForm } from './form';

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
});
