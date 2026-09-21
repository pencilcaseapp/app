/**
 * The surface shared by the floating menus: the frosted one the app uses by
 * default, and a solid one for menus that open over busy or coloured content,
 * where the blur lets the page read through.
 *
 * Only the surface itself lives here. The exit swap to an opaque background
 * and the item states stay with each menu, because Radix and Base UI spell
 * those states with different data attributes.
 */
export type MenuSurfaceVariant = 'glass' | 'solid';

export const menuSurfaceClasses: Record<MenuSurfaceVariant, string> = {
  glass: 'glass-surface glass-border',
  solid: 'bg-pca-white dark:bg-pca-grey-800 border border-pca-grey-200 dark:border-pca-grey-700',
};
