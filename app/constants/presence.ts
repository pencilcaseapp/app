/**
 * Avatar and cursor colours for the people in a document. Sixteen hues spread
 * around the wheel, so a document full of collaborators still reads as
 * distinct faces. Every colour keeps at least a 4.5:1 contrast with the white
 * initial it carries, and at least 3:1 with both the light and the dark page
 * background, so a collaborator stays readable in either theme.
 */
export const PRESENCE_COLORS = [
  '#DC2626',
  '#C2410C',
  '#A16207',
  '#4D7C0F',
  '#15803D',
  '#047857',
  '#0F766E',
  '#0E7490',
  '#0369A1',
  '#2563EB',
  '#5F5BD7',
  '#7C3AED',
  '#9333EA',
  '#C026D3',
  '#DB2777',
  '#C21D51',
] as const;

/**
 * Display names for signed out visitors. They are picked from a fixed list so
 * a visitor is recognisable while a document is being edited together, and
 * keeps the same name whenever they come back.
 */
export const ANONYMOUS_NAMES = [
  'Alpaca',
  'Axolotl',
  'Badger',
  'Bunny',
  'Capybara',
  'Chinchilla',
  'Dormouse',
  'Duckling',
  'Echidna',
  'Fennec',
  'Ferret',
  'Gecko',
  'Hamster',
  'Hedgehog',
  'Jerboa',
  'Kitten',
  'Koala',
  'Lemur',
  'Manatee',
  'Meerkat',
  'Narwhal',
  'Otter',
  'Owlet',
  'Panda',
  'Penguin',
  'Puffin',
  'Quokka',
  'Raccoon',
  'Sloth',
  'Squirrel',
  'Tapir',
  'Wombat',
] as const;

export const GUEST_ID_STORAGE_KEY = 'pca-guest-id';

export const MAX_VISIBLE_COLLABORATORS = 3;
