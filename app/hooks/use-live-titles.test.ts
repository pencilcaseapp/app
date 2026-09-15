import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useLiveTitles, type ReportedTitle } from './use-live-titles';

type Item = { id: string; label: string };

const getId = (item: Item) => item.id;
const getLabel = (item: Item) => item.label;

const renderLiveTitles = (
  items: Item[],
  reported: ReportedTitle | null = null,
) =>
  renderHook(
    (props: { items: Item[]; reported: ReportedTitle | null }) =>
      useLiveTitles(props.items, getId, getLabel, props.reported),
    { initialProps: { items, reported } },
  );

const entries = (result: { current: Map<string, string> }) =>
  [...result.current.entries()];

describe('useLiveTitles', () => {
  it('should report nothing without a reported title', () => {
    const { result } = renderLiveTitles([{ id: 'a', label: 'Old' }]);

    expect(entries(result)).toEqual([]);
  });

  it('should report nothing when the loader already lists the title', () => {
    const { result } = renderLiveTitles(
      [{ id: 'a', label: 'New' }],
      { id: 'a', title: 'New' },
    );

    expect(entries(result)).toEqual([]);
  });

  it('should keep the reported title over the label of the loader', () => {
    const { result } = renderLiveTitles(
      [{ id: 'a', label: 'Old' }],
      { id: 'a', title: 'New' },
    );

    expect(entries(result)).toEqual([['a', 'New']]);
  });

  it('should keep the title while the loader repeats the old label', () => {
    const items = [{ id: 'a', label: 'Old' }];
    const { result, rerender } = renderLiveTitles(
      items,
      { id: 'a', title: 'New' },
    );

    rerender({ items: [{ id: 'a', label: 'Old' }], reported: null });

    expect(entries(result)).toEqual([['a', 'New']]);
  });

  it('should let go once the loader caught up', () => {
    const { result, rerender } = renderLiveTitles(
      [{ id: 'a', label: 'Old' }],
      { id: 'a', title: 'New' },
    );

    rerender({ items: [{ id: 'a', label: 'New' }], reported: null });

    expect(entries(result)).toEqual([]);
  });

  it('should let go once the loader lists another title', () => {
    const { result, rerender } = renderLiveTitles(
      [{ id: 'a', label: 'Old' }],
      { id: 'a', title: 'New' },
    );

    rerender({ items: [{ id: 'a', label: 'Elsewhere' }], reported: null });

    expect(entries(result)).toEqual([]);
  });

  it('should not pick the report up again once let go', () => {
    const reported = { id: 'a', title: 'New' };
    const { result, rerender } = renderLiveTitles(
      [{ id: 'a', label: 'Old' }],
      reported,
    );

    rerender({ items: [{ id: 'a', label: 'Elsewhere' }], reported });
    rerender({ items: [{ id: 'a', label: 'Elsewhere' }], reported });

    expect(entries(result)).toEqual([]);
  });

  it('should record a later report with the label of that moment', () => {
    const { result, rerender } = renderLiveTitles(
      [{ id: 'a', label: 'Old' }],
      { id: 'a', title: 'New' },
    );

    rerender({
      items: [{ id: 'a', label: 'New' }],
      reported: { id: 'a', title: 'Newer' },
    });

    expect(entries(result)).toEqual([['a', 'Newer']]);

    rerender({ items: [{ id: 'a', label: 'Newer' }], reported: null });

    expect(entries(result)).toEqual([]);
  });

  it('should remember the title of a document that is no longer open', () => {
    const items = [{ id: 'a', label: 'Old a' }, { id: 'b', label: 'Old b' }];
    const { result, rerender } = renderLiveTitles(
      items,
      { id: 'a', title: 'New a' },
    );

    rerender({ items, reported: { id: 'b', title: 'New b' } });

    expect(entries(result)).toEqual([['a', 'New a'], ['b', 'New b']]);
  });

  it('should drop a document that is gone', () => {
    const { result, rerender } = renderLiveTitles(
      [{ id: 'a', label: 'Old' }],
      { id: 'a', title: 'New' },
    );

    rerender({ items: [], reported: null });
    rerender({ items: [{ id: 'a', label: 'Old' }], reported: null });

    expect(entries(result)).toEqual([]);
  });

  it('should ignore a report for an unknown document', () => {
    const { result, rerender } = renderLiveTitles(
      [{ id: 'a', label: 'Old' }],
      { id: 'z', title: 'New' },
    );

    rerender({ items: [{ id: 'a', label: 'Old' }], reported: null });

    expect(entries(result)).toEqual([]);
  });
});
