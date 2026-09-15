import type { Route } from './+types/doc';
import { Link, Outlet, redirect, data, useRevalidator } from 'react-router';
import { z } from 'zod';
import { CollaborativeEditor } from '~/components/collaborative-editor/collaborative-editor';
import {
  openDocument,
  OpenDocumentError,
  shareDocument,
} from '~/services/document';
import { ClientOnly } from '~/ui/client-only/client-only';
import { href } from 'react-router';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { getSignInUrl } from '~/services/auth';
import { validateForm } from '~/utils/form';
import { useDocumentTitle } from '~/contexts/document-title';
import { useEditedDocument } from '~/contexts/edited-document';
import { useCallback } from 'react';
import { useScrollToTopOn } from '~/hooks/use-scroll-to-top-on';
import { MenuOrSignInButton } from '~/components/menu-or-sign-in-button/menu-or-sign-in-button';
import { SharePanel } from '~/components/share-panel/share-panel';
import { Button } from '~/ui/button/button';
import { DocEmptyState } from '~/components/doc-empty-state/doc-empty-state';
import { PageTitle } from '~/components/page-title/page-title';
import { getUserPresenceIdentity } from '~/utils/presence';
import { Notification } from '~/ui/notification/notification';
import { DELETED_DOCUMENT_RETENTION_DAYS } from '~/constants/document';

enum DocumentError {
  NotFound,
  PermissionDenied,
}

const DELETED_DOCUMENT_NOTICE = 'This document is deleted and will be'
  + ` removed for good in ${DELETED_DOCUMENT_RETENTION_DAYS} days.`;

const shareSchema = z.object({
  shared: z.boolean(),
});

export async function loader({ params, context, request }: Route.LoaderArgs) {
  const user = context.get(optionalUserSessionContext);
  const documentUrl = href(`/doc/:id`, { id: params.id });
  const [error, document] = await openDocument(params.id, user?.id);

  if (error !== null) {
    switch (error) {
      case OpenDocumentError.NotFound: {
        return data({
          ok: false as const,
          error: DocumentError.NotFound,
          signInUrl: user ? null : getSignInUrl(href('/')),
        }, {
          status: 404,
        });
      }

      case OpenDocumentError.PermissionDenied: {
        if (!user) {
          return redirect(getSignInUrl(documentUrl));
        }

        return data({
          ok: false as const,
          error: DocumentError.PermissionDenied,
          signInUrl: null,
        }, {
          status: 403,
        });
      }

      default: {
        const exhaustiveCheck: never = error;
        throw new Error('Unhandled error case: ' + exhaustiveCheck);
      }
    }
  }

  // A visitor who just joined the document is redirected so the sidebar loader
  // re-runs and the document shows up in their nav. Only happens once.
  if (document.hasJoined) {
    return redirect(documentUrl);
  }

  return {
    ok: true as const,
    documentTitle: document.title,
    signInUrl: user ? null : getSignInUrl(documentUrl),
    isOwner: document.isOwner,
    shared: document.shared,
    deleted: document.deleted,
    presence: user ? getUserPresenceIdentity(user) : null,
    shareUrl: new URL(documentUrl, request.url).toString(),
  };
}

export async function action({ request, params, context }: Route.ActionArgs) {
  const user = context.get(optionalUserSessionContext);

  if (!user) {
    throw data('Forbidden', { status: 403 });
  }

  const form = await validateForm(request, shareSchema);

  if (!form.ok) {
    return form.formState;
  }

  const [error, result] = await shareDocument({
    documentId: params.id,
    userId: user.id,
    shared: form.data.shared,
  });

  if (error !== null) {
    throw data('Forbidden', { status: 403 });
  }

  return { ok: true as const, shared: result.shared };
}

export default function ({ params, loaderData }: Route.ComponentProps) {
  const [title, setTitle] = useDocumentTitle(
    params.id,
    loaderData.ok ? loaderData.documentTitle : '',
  );
  const { reportDocumentEdit } = useEditedDocument();
  const { revalidate } = useRevalidator();
  const onFirstEdit = useCallback(
    () => reportDocumentEdit(params.id),
    [reportDocumentEdit, params.id],
  );
  const onAccessRevoked = useCallback(() => {
    void revalidate();
  }, [revalidate]);
  const deleted = loaderData.ok && loaderData.deleted;
  // Deleting the open document puts the notice above the content, out of
  // sight for a reader halfway down a long document.
  useScrollToTopOn(deleted);

  if (!loaderData.ok && loaderData.error === DocumentError.NotFound) {
    return (
      <DocEmptyState
        title="Not Found"
        description="It may have been deleted, moved, or the link you followed is taking you nowhere."
        actionArea={<Button as={Link} to="/">Go home</Button>}
        signInUrl={loaderData.signInUrl}
        imageSrcLight="/lost-pencil-light.svg"
        imageSrcDark="/lost-pencil-dark.svg"
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
      <PageTitle>{title}</PageTitle>
      <ClientOnly>
        <CollaborativeEditor
          // Deleting or restoring changes the access the live server grants,
          // so the editor reconnects.
          key={`${params.id}:${deleted}`}
          id={params.id}
          presence={loaderData.ok ? loaderData.presence : null}
          onTitleChange={setTitle}
          onFirstEdit={onFirstEdit}
          onAccessRevoked={onAccessRevoked}
          editable={!deleted}
          notification={deleted && (
            <Notification
              variant="warning"
              title={DELETED_DOCUMENT_NOTICE}
            />
          )}
          topbarLeft={(
            <MenuOrSignInButton
              signInUrl={loaderData.ok ? loaderData.signInUrl : null}
            />
          )}
          topbarRight={loaderData.ok && loaderData.isOwner && !deleted
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
      <Outlet />
    </>
  );
}
