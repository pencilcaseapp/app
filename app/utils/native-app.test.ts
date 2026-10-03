import { describe, expect, it } from 'vitest';
import { isNativeAppRequest } from './native-app';

const requestWithUserAgent = (userAgent?: string) =>
  new Request('http://localhost/', {
    headers: userAgent ? { 'user-agent': userAgent } : {},
  });

describe('isNativeAppRequest', () => {
  it('recognises the native apps', () => {
    expect(isNativeAppRequest(requestWithUserAgent(
      'Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 PencilCaseApp',
    ))).toBe(true);
  });

  it('leaves browsers alone', () => {
    expect(isNativeAppRequest(requestWithUserAgent(
      'Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Safari/604.1',
    ))).toBe(false);
  });

  it('handles a request without a user agent', () => {
    expect(isNativeAppRequest(requestWithUserAgent())).toBe(false);
  });
});
