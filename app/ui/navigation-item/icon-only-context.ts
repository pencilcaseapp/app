import { createContext, use } from 'react';

export const IconOnlyContext = createContext(false);

export const useIconOnly = () => use(IconOnlyContext);
