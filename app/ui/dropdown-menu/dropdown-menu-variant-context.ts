import { createContext, use } from 'react';
import type { MenuSurfaceVariant } from '../menu-surface/menu-surface';

export type DropdownMenuVariant = MenuSurfaceVariant;

export const DropdownMenuVariantContext
  = createContext<DropdownMenuVariant>('glass');

export const useDropdownMenuVariant = () => use(DropdownMenuVariantContext);
