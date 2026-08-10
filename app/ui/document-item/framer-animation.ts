/**
 * Reordering a document should be noticeable without pulling attention away
 * from the document itself, so a row slides to its new position with a short
 * tween and nothing else — no bouncing, scaling, fading, or highlighting.
 */
export const REORDER_DURATION_MS = 200;

export const reorderItem = {
  type: 'tween' as const,
  duration: REORDER_DURATION_MS / 1000,
  ease: 'easeOut' as const,
};
