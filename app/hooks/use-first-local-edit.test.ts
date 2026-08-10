import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import * as Y from 'yjs';
import { useFirstLocalEdit } from './use-first-local-edit';

const REMOTE_ORIGIN = Symbol('remote');

const edit = (doc: Y.Doc, text: string, origin?: unknown) =>
  act(() => {
    doc.transact(() => {
      doc.getText('content').insert(0, text);
    }, origin);
  });

const renderFirstLocalEdit = (doc: Y.Doc, onFirstEdit: () => void) =>
  renderHook(() => useFirstLocalEdit(doc, REMOTE_ORIGIN, onFirstEdit));

describe('useFirstLocalEdit', () => {
  it('should report a local edit', () => {
    const doc = new Y.Doc();
    const onFirstEdit = vi.fn();
    renderFirstLocalEdit(doc, onFirstEdit);

    edit(doc, 'hello');

    expect(onFirstEdit).toHaveBeenCalledTimes(1);
  });

  it('should report the first local edit only', () => {
    const doc = new Y.Doc();
    const onFirstEdit = vi.fn();
    renderFirstLocalEdit(doc, onFirstEdit);

    edit(doc, 'hello');
    edit(doc, 'world');

    expect(onFirstEdit).toHaveBeenCalledTimes(1);
  });

  it('should ignore updates coming from the remote origin', () => {
    const doc = new Y.Doc();
    const onFirstEdit = vi.fn();
    renderFirstLocalEdit(doc, onFirstEdit);

    edit(doc, 'hello', REMOTE_ORIGIN);

    expect(onFirstEdit).not.toHaveBeenCalled();
  });

  it('should report a local edit after a remote one', () => {
    const doc = new Y.Doc();
    const onFirstEdit = vi.fn();
    renderFirstLocalEdit(doc, onFirstEdit);

    edit(doc, 'hello', REMOTE_ORIGIN);
    edit(doc, 'world');

    expect(onFirstEdit).toHaveBeenCalledTimes(1);
  });

  it('should stop listening when unmounted', () => {
    const doc = new Y.Doc();
    const onFirstEdit = vi.fn();
    const { unmount } = renderFirstLocalEdit(doc, onFirstEdit);

    unmount();
    edit(doc, 'hello');

    expect(onFirstEdit).not.toHaveBeenCalled();
  });
});
