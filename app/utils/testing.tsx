import { act, render } from '@testing-library/react';
import { createRoutesStub, RouterContextProvider, type Register } from 'react-router';
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react';
import { DocumentTitleProvider } from '~/contexts/document-title';
import { EditedDocumentProvider } from '~/contexts/edited-document';
import { SidebarProvider } from '~/ui/sidebar-context/sidebar-provider';
import { SocketClientProvider } from '~/contexts/socket-client';
import { ToastProvider } from '~/ui/toast/toast-provider';
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
  parents: { route: RouteEntry; fullPath: string }[] = [],
): { route: RouteEntry; fullPath: string; parents: typeof parents }[] {
  return entries.flatMap((route) => {
    const fullPath = [parentPath, route.path].filter(Boolean).join('/');
    const entry = { route, fullPath };

    return [
      { ...entry, parents },
      ...flattenRoutes(route.children ?? [], fullPath, [...parents, entry]),
    ];
  });
}

/** Imports a route module and shapes it into a route stub entry. */
async function loadRoute(file: string, path: string) {
  const module = await import(`~/${file}`);

  return {
    ...module,
    path,
    Component: module.default ?? (() => null),
    middleware: [],
    HydrateFallback: () => null,
    ErrorBoundary: () => null,
  };
}

export async function renderRoute<P extends keyof Register['pages']>(
  path: P,
  options?: Register['pages'][P] & {
    searchParams?: Record<string, string>;
    context?: RouterContextProvider;
    /**
     * Also mounts the ancestor routes from this path down, so the route
     * renders below their outlets and their loaders run. Everything
     * above stays unmounted; it only contributes URL segments.
     */
    parentRoute?: keyof Register['pages'];
  },
) {
  const match = flattenRoutes(routes).find(({ route, fullPath }) =>
    path === '/' ? route.index === true : `/${fullPath}` === path,
  );
  if (!match) {
    throw new Error(`No route found for ${path}`);
  }

  let replacedPath: string = path;
  if (options?.params) {
    for (const [key, value] of Object.entries(options.params)) {
      replacedPath = replacedPath.replace(`:${key}`, value);
    }
  }

  // The mounted chain: the target route alone, or nested below its
  // ancestors starting at `parentRoute`.
  const parents = options?.parentRoute
    ? match.parents.slice(match.parents.findIndex(
        ({ fullPath }) => `/${fullPath}` === options.parentRoute,
      ))
    : [];
  if (options?.parentRoute && parents.length === 0) {
    throw new Error(`${String(options.parentRoute)} is not above ${path}`);
  }

  const chain = [...parents, match];
  const [root, ...descendants] = await Promise.all(chain.map(
    (entry, index) => loadRoute(
      entry.route.file,
      index === 0 ? `/${entry.fullPath}` : entry.route.path ?? '',
    ),
  ));
  let stubRoute = root;
  for (const descendant of descendants) {
    stubRoute.children = [descendant];
    stubRoute = descendant;
  }

  const Stub = createRoutesStub([root], options?.context);

  if (options?.searchParams) {
    const searchParams = new URLSearchParams(options.searchParams).toString();
    replacedPath = `${replacedPath}?${searchParams}`;
  }

  const result = render(
    <ToastProvider>
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
      </AuthenticityTokenProvider>
    </ToastProvider>,
  );

  await act(async () => {});

  return result;
}
