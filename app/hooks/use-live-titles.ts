import { useMemo, useRef } from 'react';

export type ReportedTitle = {
  id: string;
  title: string;
};

type Report = {
  title: string;
  label: string;
};

/**
 * Keeps the title the editor reports for a document ahead of the label the
 * loader lists for it.
 *
 * The live server writes the title to the database behind its store
 * debounce and the navigation loader re-runs on every navigation, so
 * switching documents right after retitling one hands back the old title,
 * which the navigation would show until a later revalidation happens to run
 * after the store. A report is remembered together with the label the loader
 * listed at that moment: as long as the loader repeats that label the store
 * has not landed and the reported title wins, any other label means the
 * server caught up (or somebody else retitled the document) and the loader
 * wins again.
 *
 * Returns the titles currently ahead of the loader by document id. Like the
 * order, they are only remembered for as long as the component stays
 * mounted.
 */
export function useLiveTitles<T>(
  items: T[],
  getId: (item: T) => string,
  getLabel: (item: T) => string,
  reported: ReportedTitle | null,
) {
  const reportsRef = useRef(new Map<string, Report>());
  const recordedRef = useRef<ReportedTitle | null>(null);

  return useMemo(() => {
    const reports = reportsRef.current;
    const recorded = recordedRef.current;
    const labels = new Map(items.map(item => [getId(item), getLabel(item)]));

    // A report is recorded once, with the label of that moment: the label is
    // what tells whether the server caught up, so a later revalidation must
    // not move it.
    if (
      reported
      && (reported.id !== recorded?.id || reported.title !== recorded.title)
    ) {
      recordedRef.current = reported;
      const label = labels.get(reported.id);

      if (label !== undefined) {
        reports.set(reported.id, { title: reported.title, label });
      }
    }

    const liveTitles = new Map<string, string>();

    reports.forEach(({ title, label }, id) => {
      if (labels.get(id) !== label) {
        reports.delete(id);
      }
      else if (title !== label) {
        liveTitles.set(id, title);
      }
    });

    return liveTitles;
  }, [items, getId, getLabel, reported]);
}
