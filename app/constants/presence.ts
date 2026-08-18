/**
 * Avatar and cursor colours for the people in a document. Every colour keeps
 * at least a 4.5:1 contrast with the white initial it carries, and at least
 * 3:1 with both the light and the dark page background, so a collaborator
 * stays readable in either theme.
 */
export const PRESENCE_COLORS = [
  '#2563EB',
  '#7C3AED',
  '#DB2777',
  '#DC2626',
  '#C2410C',
  '#A16207',
  '#15803D',
  '#0F766E',
] as const;

/**
 * Display names for signed out visitors. They are picked from a fixed list so
 * a visitor is recognisable while a document is being edited together, and
 * keeps the same name whenever they come back.
 */
export const ANONYMOUS_NAMES = [
  'Nova',
  'Zephyr',
  'Comet',
  'Juniper',
  'Quill',
  'Marlow',
  'Onyx',
  'Blaze',
  'Pixel',
  'Ember',
  'Flint',
  'Koda',
  'Sable',
  'Vesper',
  'Wren',
  'Indigo',
  'Cosmo',
  'Lyric',
  'Rune',
  'Tango',
  'Willow',
  'Echo',
  'Halo',
  'Jetty',
] as const;

export const GUEST_ID_STORAGE_KEY = 'pca-guest-id';

export const MAX_VISIBLE_COLLABORATORS = 3;
