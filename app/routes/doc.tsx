import type { Route } from './+types/doc';
import { Link, redirect, data } from 'react-router';
import { z } from 'zod';
import { CollaborativeEditor } from '~/components/collaborative-editor/collaborative-editor';
import { getDocument, setDocumentShared } from '~/repos/document';
import {
  connectCollaborator,
  removeCollaboratorsForDocument,
} from '~/repos/document-collaborator';
import { ClientOnly } from '~/ui/client-only/client-only';
import { href } from 'react-router';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { getSignInUrl } from '~/services/auth';
import { validateForm } from '~/utils/form';
import { useDocumentTitle } from '~/contexts/document-title';
import { useEditedDocument } from '~/contexts/edited-document';
import { useCallback } from 'react';
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

  // Access is granted to the owner, and to anyone (including anonymous
  // visitors) while the document is shared. Unsharing therefore blocks access
  // again on the very next request.
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

  // Connect a signed-in visitor to the shared document so it also appears in
  // their navigation under all docs. The owner is never their own collaborator.
  if (user && !isOwner) {
    await connectCollaborator({
      documentId: document.id,
      userId: user.id,
    });
  }

  return {
    ok: true as const,
    documentTitle: document.title,
    signInUrl,
    isOwner,
    shared: document.shared,
    shareUrl: new URL(documentUrl, request.url).toString(),
  };
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const user = context.get(optionalUserSessionContext);
  const document = await getDocument(params.id);

  // Only the owner may change the sharing state of a document.
  if (!document || !user || user.id !== document.userId) {
    throw data('Forbidden', { status: 403 });
  }

  const form = await validateForm(request, shareSchema);

  if (!form.ok) {
    return form.formState;
  }

  const { shared } = form.data;

  await setDocumentShared(document.id, shared);

  // Unsharing removes the connected copies from every collaborator's account.
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
