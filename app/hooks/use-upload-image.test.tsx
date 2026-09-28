import { act, renderHook, screen } from '@testing-library/react';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '~/ui/toast/toast-provider';
import { uploadImageCopies, useUploadImage } from './use-upload-image';

const documentId = 'a1b2c3d4-0000-4000-8000-000000000000';
const fetchMock = vi.fn<typeof fetch>();

function renderUploadImage() {
  return renderHook(() => useUploadImage(documentId), {
    wrapper: ({ children }) => (
      <AuthenticityTokenProvider token="csrf-token">
        <ToastProvider>{children}</ToastProvider>
      </AuthenticityTokenProvider>
    ),
  });
}

const png = (size = 3) =>
  new File([new Uint8Array(size)], 'image.png', { type: 'image/png' });

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('useUploadImage', () => {
  it('posts the file with the CSRF token and hands back the image', async () => {
    fetchMock.mockResolvedValue(Response.json({
      ok: true,
      id: 'b3f1c2d4',
      src: '/user-assets/b3f1c2d4',
      width: 800,
      height: 600,
    }));
    const { result } = renderUploadImage();

    const image = await act(() => result.current(png()));

    expect(image).toEqual({
      src: '/user-assets/b3f1c2d4',
      width: 800,
      height: 600,
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`/doc/${documentId}/assets`);
    expect(init?.method).toBe('POST');
    const body = init?.body as FormData;
    expect(body.get('csrf')).toBe('csrf-token');
    expect(body.get('file')).toBeInstanceOf(File);
  });

  it('refuses a file over 10 MB without uploading it', async () => {
    const { result } = renderUploadImage();

    const image = await act(() => result.current(png(10 * 1024 * 1024 + 1)));

    expect(image).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await screen.findByText(uploadImageCopies.tooLarge))
      .toBeInTheDocument();
  });

  it.each([
    [413, uploadImageCopies.tooLarge],
    [415, uploadImageCopies.unsupported],
    [500, uploadImageCopies.failed],
  ])('tells the person when the server answers %s', async (status, copy) => {
    fetchMock.mockResolvedValue(new Response(null, { status }));
    const { result } = renderUploadImage();

    const image = await act(() => result.current(png()));

    expect(image).toBeUndefined();
    expect(await screen.findByText(copy)).toBeInTheDocument();
  });

  it('tells the person when the request fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const { result } = renderUploadImage();

    const image = await act(() => result.current(png()));

    expect(image).toBeUndefined();
    expect(await screen.findByText(uploadImageCopies.failed))
      .toBeInTheDocument();
  });
});
