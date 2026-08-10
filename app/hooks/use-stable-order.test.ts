import { act, renderHook } from '@testing-library/react';
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

const keysOf = (result: { current: readonly [Item[], unknown] }) =>
  result.current[0].map(getKey);

describe('useStableOrder', () => {
  it('should keep the initial order on first render', () => {
    const { result } = renderStableOrder(items('a', 'b', 'c'));

    expect(keysOf(result)).toEqual(['a', 'b', 'c']);
  });

  it('should ignore a resorting of known items', () => {
    const { result, rerender } = renderStableOrder(items('a', 'b', 'c'));

    rerender({ list: items('c', 'a', 'b') });

    expect(keysOf(result)).toEqual(['a', 'b', 'c']);
  });

  it('should prepend new items in the given order', () => {
    const { result, rerender } = renderStableOrder(items('a', 'b'));

    rerender({ list: items('d', 'c', 'b', 'a') });

    expect(keysOf(result)).toEqual(['d', 'c', 'a', 'b']);
  });

  it('should drop items that are gone', () => {
    const { result, rerender } = renderStableOrder(items('a', 'b', 'c'));

    rerender({ list: items('c', 'a') });

    expect(keysOf(result)).toEqual(['a', 'c']);
  });

  it('should not remember items that came back', () => {
    const { result, rerender } = renderStableOrder(items('a', 'b', 'c'));

    rerender({ list: items('a', 'c') });
    rerender({ list: items('a', 'b', 'c') });

    expect(keysOf(result)).toEqual(['b', 'a', 'c']);
  });

  it('should return the latest version of a known item', () => {
    const { result, rerender } = renderHook(
      ({ list }: { list: { id: string; label: string }[] }) =>
        useStableOrder(list, item => item.id),
      { initialProps: { list: [{ id: 'a', label: 'old' }] } },
    );

    rerender({ list: [{ id: 'a', label: 'new' }] });

    expect(result.current[0]).toEqual([{ id: 'a', label: 'new' }]);
  });

  describe('moveToTop', () => {
    it('should pull the given item to the top', () => {
      const { result } = renderStableOrder(items('a', 'b', 'c'));

      act(() => result.current[1]('c'));

      expect(keysOf(result)).toEqual(['c', 'a', 'b']);
    });

    it('should keep the item on top across resortings', () => {
      const { result, rerender } = renderStableOrder(items('a', 'b', 'c'));

      act(() => result.current[1]('c'));
      rerender({ list: items('b', 'a', 'c') });

      expect(keysOf(result)).toEqual(['c', 'a', 'b']);
    });

    it('should keep an earlier moved item below the latest one', () => {
      const { result } = renderStableOrder(items('a', 'b', 'c'));

      act(() => result.current[1]('c'));
      act(() => result.current[1]('b'));

      expect(keysOf(result)).toEqual(['b', 'c', 'a']);
    });

    it('should ignore an unknown item', () => {
      const { result } = renderStableOrder(items('a', 'b'));

      act(() => result.current[1]('z'));

      expect(keysOf(result)).toEqual(['a', 'b']);
    });

    it('should place a moved item on top once it shows up', () => {
      const { result, rerender } = renderStableOrder(items('a', 'b'));

      act(() => result.current[1]('c'));
      rerender({ list: items('a', 'b', 'c') });

      expect(keysOf(result)).toEqual(['c', 'a', 'b']);
    });

    it('should let a new item outrank the moved one', () => {
      const { result, rerender } = renderStableOrder(items('a', 'b'));

      act(() => result.current[1]('b'));
      rerender({ list: items('c', 'a', 'b') });

      expect(keysOf(result)).toEqual(['c', 'b', 'a']);
    });

    it('should keep a new item on top of the moved one afterwards', () => {
      const { result, rerender } = renderStableOrder(items('a', 'b'));

      act(() => result.current[1]('b'));
      rerender({ list: items('c', 'a', 'b') });
      rerender({ list: items('b', 'a', 'c') });

      expect(keysOf(result)).toEqual(['c', 'b', 'a']);
    });

    it('should move the same item again on a later call', () => {
      const { result, rerender } = renderStableOrder(items('a', 'b'));

      act(() => result.current[1]('b'));
      rerender({ list: items('c', 'a', 'b') });
      act(() => result.current[1]('b'));

      expect(keysOf(result)).toEqual(['b', 'c', 'a']);
    });
  });
});
