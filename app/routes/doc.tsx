import type { Route } from './+types/doc';
import { Link, redirect, data } from 'react-router';
import { CollaborativeEditor } from '~/components/collaborative-editor/collaborative-editor';
import { getDocument } from '~/repos/document';
import { ClientOnly } from '~/ui/client-only/client-only';
import { href } from 'react-router';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { getSignInUrl } from '~/services/auth';
import { useDocumentTitle } from '~/contexts/document-title';
import { MenuOrSignInButton } from '~/components/menu-or-sign-in-button/menu-or-sign-in-button';
import { Button } from '~/ui/button/button';
import { DocEmptyState } from '~/components/doc-empty-state/doc-empty-state';

enum DocumentError {
  NotFound,
  PermissionDenied,
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const user = context.get(optionalUserSessionContext);
  const document = await getDocument(params.id);

  if (!document) {
    return data({
      ok: false as const,
      error: DocumentError.NotFound,
      signInUrl: user ? null : getSignInUrl(href('/')),
    }, {
      status: 404,
    });
  }

  const documentTitle = document.title;
  const documentUrl = href(`/doc/:id`, { id: params.id });
  const signInUrl = user ? null : getSignInUrl(documentUrl);

  if (user && user.id !== document.userId) {
    return data({
      ok: false as const,
      error: DocumentError.PermissionDenied,
      signInUrl,
    }, {
      status: 403,
    });
  }

  if (!user) {
    return redirect(getSignInUrl(documentUrl));
  }

  return {
    ok: true as const,
    documentTitle,
    signInUrl,
  };
}

export default function ({ params, loaderData }: Route.ComponentProps) {
  const [title, setTitle] = useDocumentTitle(loaderData.ok ? loaderData.documentTitle : '');

  if (!loaderData.ok && loaderData.error === DocumentError.NotFound) {
    return (
      <DocEmptyState
        title="Not Found"
        description="It may have been deleted, moved, or the link you followed is taking you nowhere."
        actionArea={<Button as={Link} to="/">Go home</Button>}
        signInUrl={loaderData.signInUrl}
      />
    );
  }

  if (!loaderData.ok && loaderData.error === DocumentError.PermissionDenied) {
    return (
      <DocEmptyState
        title="Permission Denied"
        description="You do not have permission to view this document. Please ask the owner to share the doc with you."
        signInUrl={loaderData.signInUrl}
      />
    );
  }

  return (
    <>
      <title>{title}</title>
      <ClientOnly>
        <CollaborativeEditor
          key={params.id}
          id={params.id}
          onTitleChange={setTitle}
          topbarLeft={(
            <MenuOrSignInButton
              signInUrl={loaderData.signInUrl}
            />
          )}
        />
      </ClientOnly>
    </>
  );
}
