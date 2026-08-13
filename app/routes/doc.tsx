import type { Route } from './+types/doc';
import { Link, redirect, data, useFetcher } from 'react-router';
import { z } from 'zod';
import { CollaborativeEditor } from '~/components/collaborative-editor/collaborative-editor';
import {
  getDocument,
  isDocumentCollaborator,
  removeCollaboratorsForDocument,
  setDocumentShared,
} from '~/repos/document';
import { ClientOnly } from '~/ui/client-only/client-only';
import { href } from 'react-router';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { getSignInUrl } from '~/services/auth';
import { validateForm } from '~/utils/form';
import { useDocumentTitle } from '~/contexts/document-title';
import { useEditedDocument } from '~/contexts/edited-document';
import { useCallback, useEffect } from 'react';
import { useAuthenticityToken } from 'remix-utils/csrf/react';
import { MenuOrSignInButton } from '~/components/menu-or-sign-in-button/menu-or-sign-in-button';
import { SharePanel } from '~/components/share-panel/share-panel';
import { Button } from '~/ui/button/button';
import { DocEmptyState } from '~/components/doc-empty-state/doc-empty-state';

enum DocumentError {
  NotFound,
  PermissionDenied,
}

const shareSchema = z.object({
  shared: z.boolean(),
});

export async function loader({ params, context, request }: Route.LoaderArgs) {
  const user = context.get(optionalUserSessionContext);
  const document = await getDocument(params.id);
  const documentUrl = href(`/doc/:id`, { id: params.id });

  if (!document) {
    return data({
      ok: false as const,
      error: DocumentError.NotFound,
      signInUrl: user ? null : getSignInUrl(href('/')),
    }, {
      status: 404,
    });
  }

  const isOwner = !!user && user.id === document.userId;
  const signInUrl = user ? null : getSignInUrl(documentUrl);

  if (!isOwner && !document.shared) {
    if (!user) {
      return redirect(getSignInUrl(documentUrl));
    }

    return data({
      ok: false as const,
      error: DocumentError.PermissionDenied,
      signInUrl,
    }, {
      status: 403,
    });
  }

  const needsConnect = !!user && !isOwner
    && !(await isDocumentCollaborator(document.id, user.id));

  return {
    ok: true as const,
    documentTitle: document.title,
    signInUrl,
    isOwner,
    shared: document.shared,
    shareUrl: new URL(documentUrl, request.url).toString(),
    needsConnect,
  };
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const user = context.get(optionalUserSessionContext);
  const document = await getDocument(params.id);

  if (!document || !user || user.id !== document.userId) {
    throw data('Forbidden', { status: 403 });
  }

  const form = await validateForm(request, shareSchema);

  if (!form.ok) {
    return form.formState;
  }

  const { shared } = form.data;

  await setDocumentShared(document.id, shared);

  if (!shared) {
    await removeCollaboratorsForDocument(document.id);
  }

  return { ok: true as const, shared };
}

export default function ({ params, loaderData }: Route.ComponentProps) {
  const [title, setTitle] = useDocumentTitle(loaderData.ok ? loaderData.documentTitle : '');
  const { reportDocumentEdit } = useEditedDocument();
  const onFirstEdit = useCallback(
    () => reportDocumentEdit(params.id),
    [reportDocumentEdit, params.id],
  );

  const joinFetcher = useFetcher();
  const csrfToken = useAuthenticityToken();
  const needsConnect = loaderData.ok && loaderData.needsConnect;

  useEffect(() => {
    if (!needsConnect || joinFetcher.state !== 'idle' || joinFetcher.data) {
      return;
    }

    joinFetcher.submit(
      { csrf: csrfToken },
      { method: 'post', action: href('/doc/:id/join', { id: params.id }) },
    );
  }, [needsConnect, joinFetcher, csrfToken, params.id]);

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
          onFirstEdit={onFirstEdit}
          topbarLeft={(
            <MenuOrSignInButton
              signInUrl={loaderData.ok ? loaderData.signInUrl : null}
            />
          )}
          topbarRight={loaderData.ok && loaderData.isOwner
            ? (
                <SharePanel
                  documentId={params.id}
                  shared={loaderData.shared}
                  shareUrl={loaderData.shareUrl}
                />
              )
            : null}
        />
      </ClientOnly>
    </>
  );
}
