import { act, render } from '@testing-library/react';
import { createRoutesStub, RouterContextProvider, type Register } from 'react-router';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import { DocumentTitleProvider } from '~/contexts/document-title';
import { EditedDocumentProvider } from '~/contexts/edited-document';
import { SidebarProvider } from '~/ui/sidebar-context/sidebar-provider';
import { SocketClientProvider } from '~/contexts/socket-client';
import routes from '~/routes';

type HappyDOMWindow = typeof window & {
  happyDOM: { setViewport: (viewport: { width: number }) => void };
};

/** Resizes the happy-dom window so `useMedia` queries resolve. */
export function setViewportWidth(width: number) {
  (window as HappyDOMWindow).happyDOM.setViewport({ width });
}

type RouteEntry = (typeof routes)[number];

/** Flattens the route tree, joining each route's path with its parents'. */
function flattenRoutes(
  entries: RouteEntry[],
  parentPath = '',
): { route: RouteEntry; fullPath: string }[] {
  return entries.flatMap((route) => {
    const fullPath = [parentPath, route.path].filter(Boolean).join('/');

    return [
      { route, fullPath },
      ...flattenRoutes(route.children ?? [], fullPath),
    ];
  });
}

export async function renderRoute<P extends keyof Register['pages']>(
  path: P,
  options?: Register['pages'][P] & { searchParams?: Record<string, string>; context?: RouterContextProvider },
) {
  const match = flattenRoutes(routes).find(({ route, fullPath }) =>
    path === '/' ? route.index === true : `/${fullPath}` === path,
  );
  const file = await import(`~/${match?.route.file}`);
  const Component = file.default ?? (() => null);

  let replacedPath: string = path;
  if (options?.params) {
    for (const [key, value] of Object.entries(options.params)) {
      replacedPath = replacedPath.replace(`:${key}`, value);
    }
  }

  const Stub = createRoutesStub([
    {
      ...file,
      path,
      Component,
      middleware: [],
      HydrateFallback: () => null,
      ErrorBoundary: () => null,
    },
  ], options?.context);

  if (options?.searchParams) {
    const searchParams = new URLSearchParams(options.searchParams).toString();
    replacedPath = `${replacedPath}?${searchParams}`;
  }

  const result = render(
    <AuthenticityTokenProvider token="test-token">
      <DocumentTitleProvider>
        <EditedDocumentProvider>
          <SidebarProvider>
            <SocketClientProvider>
              <Stub initialEntries={[replacedPath]} />
            </SocketClientProvider>
          </SidebarProvider>
        </EditedDocumentProvider>
      </DocumentTitleProvider>
    </AuthenticityTokenProvider>,
  );

  await act(async () => {});

  return result;
}
