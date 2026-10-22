import type { Page } from '@playwright/test';

/** Fetcher submissions post to the route's `.data` URL. */
export function waitForPost(page: Page, ...routeSegments: string[]) {
  return page.waitForResponse(response =>
    response.request().method() === 'POST'
    && routeSegments.some(segment =>
      new URL(response.url()).pathname.includes(segment)),
  );
}
