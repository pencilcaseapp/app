import { useEffect, useRef } from 'react';
import { DOCUMENT_SCROLL_STORAGE_PREFIX } from '~/constants/document';

/** How long the reader has to sit still before the position is written. */
const SAVE_DELAY_MS = 200;

/**
 * How long the content may keep arriving before we stop waiting for it and
 * land as close to the saved position as the document reaches.
 */
const GROWTH_TIMEOUT_MS = 2000;

/**
 * Tells a position this page load saved from one an earlier load left
 * behind. The editor remounts whenever the access to a document changes,
 * and a reader halfway down one must not be moved by that — only by a
 * reload, which is the one thing that loses the position on its own.
 */
const PAGE_LOAD_ID = crypto.randomUUID();

type StoredPosition = {
  top: number;
  loadId: string;
};

const storageKey = (documentId: string) =>
  `${DOCUMENT_SCROLL_STORAGE_PREFIX}${documentId}`;

function readPosition(documentId: string): StoredPosition | null {
  try {
    const stored = sessionStorage.getItem(storageKey(documentId));

    if (!stored) {
      return null;
    }

    const position: unknown = JSON.parse(stored);

    if (
      typeof position !== 'object'
      || position === null
      || typeof (position as StoredPosition).top !== 'number'
      || typeof (position as StoredPosition).loadId !== 'string'
    ) {
      return null;
    }

    return position as StoredPosition;
  }
  catch {
    // Private browsing can make sessionStorage throw, and an entry we
    // cannot read is one we have no position from. Either way the reader
    // only loses the restore.
    return null;
  }
}

function writePosition(documentId: string, top: number) {
  try {
    sessionStorage.setItem(
      storageKey(documentId),
      JSON.stringify({ top, loadId: PAGE_LOAD_ID } satisfies StoredPosition),
    );
  }
  catch {
    // See readPosition.
  }
}

/**
 * Keeps the reader where they were in a document across a reload.
 *
 * The page itself scrolls, so the position is the window's, kept per
 * document id for as long as the tab lives. Restoring it has to wait for
 * `isSynced`: the content arrives over the live connection after the page
 * has loaded, and until Lexical has rendered it the document is a single
 * empty line with nowhere to scroll to. Even then it grows over a few
 * frames, so the position is taken as soon as the page is tall enough to
 * reach it and `GROWTH_TIMEOUT_MS` later at the latest — a document that
 * lost content while the reader was away never grows back that far.
 */
export function useDocumentScrollRestoration(
  documentId: string,
  isSynced: boolean,
) {
  const targetRef = useRef<number | null>(null);
  const hasRestoredRef = useRef(false);

  // Read before this page load can write anything: the position we are
  // after is the previous load's, and a scroll event while the page is
  // still loading would have replaced it by the time the content is here.
  useEffect(() => {
    const position = readPosition(documentId);

    targetRef.current
      = position && position.loadId !== PAGE_LOAD_ID && position.top > 0
        ? position.top
        : null;
    hasRestoredRef.current = false;
  }, [documentId]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const save = () => writePosition(documentId, window.scrollY);

    const onScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(save, SAVE_DELAY_MS);
    };

    // A reload right after a scroll would otherwise come back to whatever
    // the last idle moment wrote out.
    const onPageHide = () => {
      clearTimeout(timeout);
      save();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', onPageHide);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [documentId]);

  useEffect(() => {
    const target = targetRef.current;

    if (!isSynced || hasRestoredRef.current || target === null) {
      return;
    }

    hasRestoredRef.current = true;

    const reachableTop = () => Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      0,
    );
    let settled = false;

    const scrollBack = () => {
      settled = true;
      window.scrollTo({ top: Math.min(target, reachableTop()) });
    };

    if (reachableTop() >= target) {
      scrollBack();
      return;
    }

    const observer = new ResizeObserver(() => {
      if (settled || reachableTop() < target) {
        return;
      }

      scrollBack();
      observer.disconnect();
    });

    observer.observe(document.body);

    const timeout = setTimeout(() => {
      if (settled) {
        return;
      }

      scrollBack();
      observer.disconnect();
    }, GROWTH_TIMEOUT_MS);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [documentId, isSynced]);
}
