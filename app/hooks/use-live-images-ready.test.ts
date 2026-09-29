import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import {
  LIVE_IMAGES_TIMEOUT,
  useLiveImagesReady,
} from './use-live-images-ready';

const src = '/doc/a1e0b1c3-0000-4000-8000-000000000000/assets/'
  + 'b3f1c2d4-0000-4000-8000-000000000000';

function createImage(decode = () => Promise.resolve()) {
  const image = document.createElement('img');
  image.setAttribute('src', src);
  image.loading = 'lazy';
  Object.defineProperty(image, 'complete', { value: true });
  Object.defineProperty(image, 'naturalWidth', { value: 800 });
  image.decode = vi.fn(decode);

  return image;
}

/** A shown preview image next to the editor drawing the same one. */
function createContainer(liveImage?: HTMLImageElement) {
  const container = document.createElement('div');
  const preview = document.createElement('div');
  const editor = document.createElement('div');
  editor.setAttribute('data-lexical-editor', 'true');
  preview.append(createImage());
  if (liveImage) {
    editor.append(liveImage);
  }
  container.append(preview, editor);
  document.body.append(container);

  return container;
}

function renderReady(container: HTMLElement, isSynced: boolean) {
  return renderHook(
    ({ isSynced }) => useLiveImagesReady({ current: container }, isSynced),
    { initialProps: { isSynced } },
  );
}

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('useLiveImagesReady', () => {
  test('is not ready before the sync', () => {
    const { result } = renderReady(createContainer(createImage()), false);

    expect(result.current).toBe(false);
  });

  test('is ready once the editor has decoded the image', async () => {
    let decoded = () => {};
    const liveImage = createImage(() => new Promise((resolve) => {
      decoded = resolve;
    }));
    const { result } = renderReady(createContainer(liveImage), true);

    await waitFor(() => expect(liveImage.decode).toHaveBeenCalled());
    expect(liveImage.loading).toBe('eager');
    expect(result.current).toBe(false);

    act(() => decoded());

    await waitFor(() => expect(result.current).toBe(true));
  });

  test('matches a preview image on the CDN by its original source', async () => {
    const liveImage = createImage();
    const container = createContainer(liveImage);
    const previewImage = container.querySelector('img')!;
    previewImage.dataset.src = src;
    previewImage.setAttribute('src', 'https://cdn.example/a');
    const { result } = renderReady(container, true);

    await waitFor(() => expect(result.current).toBe(true));
    expect(liveImage.decode).toHaveBeenCalled();
  });

  test('stops waiting for an image that never decodes', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const liveImage = createImage(() => new Promise(() => {}));
    const { result } = renderReady(createContainer(liveImage), true);

    await act(() => vi.advanceTimersByTimeAsync(LIVE_IMAGES_TIMEOUT));

    expect(result.current).toBe(true);
  });

  test('is ready right away without an image on show', async () => {
    const container = document.createElement('div');
    const { result } = renderReady(container, true);

    await waitFor(() => expect(result.current).toBe(true));
  });
});
