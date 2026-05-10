import type { PropsWithChildren } from 'react';
import {
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
} from 'react-router';

export interface LayoutBaseProps extends PropsWithChildren {
  bodyClassName?: string;
}

export const LayoutBase: React.FC<LayoutBaseProps>
  = ({ children, bodyClassName }) => {
    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <Meta />
          <Links />
        </head>
        <body className={bodyClassName}>
          {children}
          <ScrollRestoration />
          <Scripts />
        </body>
      </html>
    );
  };
