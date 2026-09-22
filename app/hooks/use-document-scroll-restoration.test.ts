import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DOCUMENT_SCROLL_STORAGE_PREFIX } from '~/constants/document';
import { useDocumentScrollRestoration } from './use-document-scroll-restoration';

const DOCUMENT_ID = 'doc-1';
const STORAGE_KEY = `${DOCUMENT_SCROLL_STORAGE_PREFIX}${DOCUMENT_ID}`;

const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

/*
 * happy-dom reports zero for every layout property and never runs a
 * ResizeObserver, so the page height and the content growing after the sync
 * are both stood in for.
 */
let grow: () => void;

class FakeResizeObserver {
  constructor(private callback: ResizeObserverCallback) {
    grow = () => this.callback([], this as unknown as ResizeObserver);
  }

  observe() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', FakeResizeObserver);

const setPageHeight = (height: number) =>
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    value: height,
    configurable: true,
  });

const setScrollY = (top: number) =>
  Object.defineProperty(window, 'scrollY', { value: top, configurable: true });

/** A position left behind by an earlier load of the page. */
const storeEarlierPosition = (top: number) =>
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ top, loadId: 'an-earlier-page-load' }),
  );

const storedPosition = () =>
  JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');

const renderRestoration = (isSynced: boolean) =>
  renderHook(
    ({ isSynced }: { isSynced: boolean }) =>
      useDocumentScrollRestoration(DOCUMENT_ID, isSynced),
    { initialProps: { isSynced } },
  );

beforeEach(() => {
  vi.useFakeTimers();
  // The window is 768px tall, so this leaves 1000px to scroll through.
  setPageHeight(1768);
  setScrollY(0);
});

afterEach(() => {
  vi.useRealTimers();
  sessionStorage.clear();
  scrollTo.mockClear();
});

describe('useDocumentScrollRestoration', () => {
  it('saves the position the reader comes to rest at', () => {
    renderRestoration(true);

    setScrollY(420);
    window.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(200);

    expect(storedPosition()).toMatchObject({ top: 420 });
  });

  it('writes the position out when the page goes away', () => {
    renderRestoration(true);

    setScrollY(420);
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('pagehide'));

    expect(storedPosition()).toMatchObject({ top: 420 });
  });

  it('restores the position once the document is synced', () => {
    storeEarlierPosition(500);
    const { rerender } = renderRestoration(false);

    expect(scrollTo).not.toHaveBeenCalled();

    rerender({ isSynced: true });

    expect(scrollTo).toHaveBeenCalledWith({ top: 500 });
  });

  it('restores the position only once', () => {
    storeEarlierPosition(500);
    const { rerender } = renderRestoration(true);

    rerender({ isSynced: false });
    rerender({ isSynced: true });

    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it('waits for the content to make the page tall enough', () => {
    storeEarlierPosition(900);
    setPageHeight(768);
    renderRestoration(true);

    expect(scrollTo).not.toHaveBeenCalled();

    setPageHeight(1768);
    grow();

    expect(scrollTo).toHaveBeenCalledWith({ top: 900 });
  });

  it('lands as far down as a document that lost content reaches', () => {
    storeEarlierPosition(5000);
    renderRestoration(true);

    vi.advanceTimersByTime(2000);

    expect(scrollTo).toHaveBeenCalledWith({ top: 1000 });
  });

  it('leaves a first visit at the top of the document', () => {
    renderRestoration(true);

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('does not restore a position this page load saved', () => {
    const saved = renderRestoration(true);

    setScrollY(420);
    window.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(200);
    saved.unmount();

    renderRestoration(true);

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
