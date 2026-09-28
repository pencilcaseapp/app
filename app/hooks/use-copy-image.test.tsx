import { act, renderHook, screen } from '@testing-library/react';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '~/ui/toast/toast-provider';
import { copyImageCopies, useCopyImage } from './use-copy-image';

const documentId = 'a1e0b1c3-0000-4000-8000-000000000000';
const assetId = 'b3f1c2d4-0000-4000-8000-000000000000';
const otherImage = {
  src: '/doc/c4a2d3e5-0000-4000-8000-000000000000/assets/'
    + 'd5b3e4f6-0000-4000-8000-000000000000',
  width: 300,
  height: 200,
};
const fetchMock = vi.fn<typeof fetch>();

function renderCopyImage() {
  return renderHook(() => useCopyImage(documentId), {
    wrapper: ({ children }) => (
      <AuthenticityTokenProvider token="csrf-token">
        <ToastProvider>{children}</ToastProvider>
      </AuthenticityTokenProvider>
    ),
  });
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('useCopyImage', () => {
  it('posts the src with the CSRF token and hands back the copy', async () => {
    fetchMock.mockResolvedValue(Response.json({
      ok: true,
      id: assetId,
      src: `/doc/${documentId}/assets/${assetId}`,
      width: 300,
      height: 200,
    }));
    const { result } = renderCopyImage();

    const image = await act(() => result.current(otherImage));

    expect(image).toEqual({
      src: `/doc/${documentId}/assets/${assetId}`,
      width: 300,
      height: 200,
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`/doc/${documentId}/assets/copies`);
    expect(init?.method).toBe('POST');
    const body = init?.body as FormData;
    expect(body.get('csrf')).toBe('csrf-token');
    expect(body.get('src')).toBe(otherImage.src);
  });

  it.each([
    ['of this document', `/doc/${documentId}/assets/${assetId}`],
    ['that is not ours', 'https://example.com/image.png'],
  ])('needs no copy for an image %s', (_, src) => {
    const { result } = renderCopyImage();

    expect(result.current({ ...otherImage, src })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('tells the person when the copy fails', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));
    const { result } = renderCopyImage();

    const image = await act(() => result.current(otherImage));

    expect(image).toBeUndefined();
    expect(await screen.findByText(copyImageCopies.failed))
      .toBeInTheDocument();
  });
});
