import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useStableOrder } from './use-stable-order';

type Item = { id: string };

const getKey = (item: Item) => item.id;

const items = (...ids: string[]) => ids.map(id => ({ id }));

const renderStableOrder = (initialItems: Item[]) =>
  renderHook(
    ({ list }: { list: Item[] }) => useStableOrder(list, getKey),
    { initialProps: { list: initialItems } },
  );

describe('useStableOrder', () => {
  it('should keep the initial order on first render', () => {
    const { result } = renderStableOrder(items('a', 'b', 'c'));

    expect(result.current.map(getKey)).toEqual(['a', 'b', 'c']);
  });

  it('should ignore a resorting of known items', () => {
    const { result, rerender } = renderStableOrder(items('a', 'b', 'c'));

    rerender({ list: items('c', 'a', 'b') });

    expect(result.current.map(getKey)).toEqual(['a', 'b', 'c']);
  });

  it('should prepend new items in the given order', () => {
    const { result, rerender } = renderStableOrder(items('a', 'b'));

    rerender({ list: items('d', 'c', 'b', 'a') });

    expect(result.current.map(getKey)).toEqual(['d', 'c', 'a', 'b']);
  });

  it('should drop items that are gone', () => {
    const { result, rerender } = renderStableOrder(items('a', 'b', 'c'));

    rerender({ list: items('c', 'a') });

    expect(result.current.map(getKey)).toEqual(['a', 'c']);
  });

  it('should not remember items that came back', () => {
    const { result, rerender } = renderStableOrder(items('a', 'b', 'c'));

    rerender({ list: items('a', 'c') });
    rerender({ list: items('a', 'b', 'c') });

    expect(result.current.map(getKey)).toEqual(['b', 'a', 'c']);
  });

  it('should return the latest version of a known item', () => {
    const { result, rerender } = renderHook(
      ({ list }: { list: { id: string; label: string }[] }) =>
        useStableOrder(list, item => item.id),
      { initialProps: { list: [{ id: 'a', label: 'old' }] } },
    );

    rerender({ list: [{ id: 'a', label: 'new' }] });

    expect(result.current).toEqual([{ id: 'a', label: 'new' }]);
  });
});
