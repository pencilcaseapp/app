/**
 * Reordering a document should be noticeable without pulling attention away
 * from the document itself, so items slide to their new position with a short
 * tween and nothing else — no fading, scaling, or highlighting.
 */
export const reorderItem = {
  type: 'tween' as const,
  duration: 0.2,
  ease: 'easeOut' as const,
};
