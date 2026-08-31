import { createContext, use, type FC, type PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';

export const SettingsFooterContext = createContext<HTMLElement | null>(null);

/*
 * The actions of a settings section belong in the dialog footer, which
 * sits next to the content area rather than inside it. `SettingsDialog`
 * hands the footer element down through the context and the section
 * routes portal into it, so the buttons stay part of the section's React
 * tree — and with it of its form.
 */
export const SettingsFooter: FC<PropsWithChildren> = ({ children }) => {
  const footer = use(SettingsFooterContext);

  return footer ? createPortal(children, footer) : null;
};
