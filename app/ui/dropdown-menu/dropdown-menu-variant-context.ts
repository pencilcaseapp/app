import { createContext, use } from 'react';

export type DropdownMenuVariant = 'glass' | 'solid';

export const DropdownMenuVariantContext
  = createContext<DropdownMenuVariant>('glass');

export const useDropdownMenuVariant = () => use(DropdownMenuVariantContext);
