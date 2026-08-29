export const toggleNavigation = {
  open: {
    x: 0,
    transition: {
      delay: 0.3,
      type: 'tween' as const,
      duration: 0.3,
      ease: 'easeInOut' as const,
    },
  },
  close: {
    x: '-100%',
    transition: {

      type: 'tween' as const,
      duration: 0.3,
      ease: 'easeInOut' as const,
    },
  },
};

export const slimNavigation = {
  open: {
    x: '-100%',
    transition: {
      type: 'tween' as const,
      duration: 0.3,
      ease: 'easeInOut' as const,
    },
  },
  close: {
    x: 0,
    transition: {
      delay: 0.3,
      type: 'tween' as const,
      duration: 0.3,
      ease: 'easeInOut' as const,
    },
  },
};
