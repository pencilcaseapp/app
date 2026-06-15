export const toggleNavigation = {
  open: {
    x: 0,
    transition: {
      type: 'keyframes' as const,
    },
  },
  close: {
    x: '-100%',
    transition: {
      delay: 0.3,
      type: 'keyframes' as const,
    },
  },
};

export const slimNavigation = {
  open: {
    x: '-100%',
    transition: {
      type: 'keyframes' as const,
    },
  },
  close: {
    x: 0,
    transition: {
      delay: 0.5,
      type: 'keyframes' as const,
    },
  },
};
