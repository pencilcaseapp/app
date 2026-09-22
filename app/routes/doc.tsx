import type { Route } from './+types/doc';
import { Link, Outlet, redirect, data, useRevalidator } from 'react-router';
import { CollaborativeEditor } from '~/components/collaborative-editor/collaborative-editor';
import { openDocument, OpenDocumentError } from '~/services/document';
import {
  inviteCollaborator,
  InviteCollaboratorError,
  listInvitedCollaborators,
} from '~/services/document-invite';
import { ClientOnly } from '~/ui/client-only/client-only';
import { href } from 'react-router';
import { optionalUserSessionContext } from '~/contexts/user-session';
import { getSignInUrl } from '~/services/auth';
import { returnFormError, validateForm } from '~/utils/form';
import { useDocumentTitle } from '~/contexts/document-title';
import { useEditedDocument } from '~/contexts/edited-document';
import { useCallback, useState } from 'react';
import { useScrollToTopOn } from '~/hooks/use-scroll-to-top-on';
import { MenuOrSignInButton } from '~/components/menu-or-sign-in-button/menu-or-sign-in-button';
import { SharePanel } from '~/components/share-panel/share-panel';
import { Button } from '~/ui/button/button';
import { DocEmptyState } from '~/components/doc-empty-state/doc-empty-state';
import { PageTitle } from '~/components/page-title/page-title';
import { getUserPresenceIdentity } from '~/utils/presence';
import { Notification } from '~/ui/notification/notification';
import {
  DELETED_DOCUMENT_RETENTION_DAYS,
  documentInviteCopies,
} from '~/constants/document';
import {
  inviteFormSchema,
  type InviteFormResult,
} from '~/components/share-panel/invite-form';

enum DocumentError {
  NotFound,
  PermissionDenied,
}

const DELETED_DOCUMENT_NOTICE = 'This document is deleted and will be'
  + ` removed for good in ${DELETED_DOCUMENT_RETENTION_DAYS} days.`;

const inviteErrorMessages = {
  [InviteCollaboratorError.SubscriptionRequired]:
    documentInviteCopies.subscriptionRequired,
  [InviteCollaboratorError.Owner]: documentInviteCopies.owner,
  [InviteCollaboratorError.TooManyInvites]:
    documentInviteCopies.tooManyInvites,
  [InviteCollaboratorError.AlreadyInvited]:
    documentInviteCopies.alreadyInvited,
};

export async function loader({ params, context, request }: Route.LoaderArgs) {
  const user = context.get(optionalUserSessionContext);
  const documentUrl = href(`/doc/:id`, { id: params.id });
  const [error, document] = await openDocument(params.id, user ?? undefined);

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

  const isOwner = !!user && document.isOwner;

  return {
    ok: true as const,
    documentTitle: document.title,
    signInUrl: user ? null : getSignInUrl(documentUrl),
    owner: isOwner ? { name: user.name, email: user.email } : null,
    invited: isOwner ? await listInvitedCollaborators(params.id) : [],
    hasSubscription: user?.hasSubscription ?? false,
    shared: document.shared,
    linkAccess: document.linkAccess,
    deleted: document.deleted,
    readOnly: document.readOnly,
    presence: user ? getUserPresenceIdentity(user) : null,
    shareUrl: new URL(documentUrl, request.url).toString(),
  };
}

/**
 * Invites somebody by e-mail from the share panel's form. A refused invite
 * comes back as an error on the address field; the other actions of the
 * panel have resource routes of their own.
 */
export async function action({ request, params, context }: Route.ActionArgs) {
  const user = context.get(optionalUserSessionContext);

  if (!user) {
    throw data('Forbidden', { status: 403 });
  }

  const form = await validateForm(request, inviteFormSchema);

  if (!form.ok) {
    return form.formState;
  }

  const [error, result] = await inviteCollaborator({
    documentId: params.id,
    user,
    email: form.data.email,
    access: form.data.access,
  });

  if (error === InviteCollaboratorError.PermissionDenied) {
    throw data('Forbidden', { status: 403 });
  }

  if (error !== null) {
    return returnFormError(form.data, {
      email: { message: inviteErrorMessages[error] },
    });
  }

  return {
    ok: true,
    invited: { email: result.email },
  } satisfies InviteFormResult;
}

export default function ({ params, loaderData }: Route.ComponentProps) {
  const [title, setTitle] = useDocumentTitle(
    params.id,
    loaderData.ok ? loaderData.documentTitle : '',
  );
  const { reportDocumentEdit } = useEditedDocument();
  const { revalidate } = useRevalidator();
  // Counts the connections the server closed on us. Once the loader has
  // said what we may do now, the editor is remounted to reconnect with
  // that — whether or not the answer changed.
  const [reconnects, setReconnects] = useState(0);
  // What the server switched the open connection to, ahead of the loader
  // saying the same: the editor has to stop taking edits the server drops.
  const [liveReadOnly, setLiveReadOnly] = useState<boolean | null>(null);
  const onFirstEdit = useCallback(
    () => reportDocumentEdit(params.id),
    [reportDocumentEdit, params.id],
  );
  const onAccessRevoked = useCallback(async () => {
    await revalidate();
    setReconnects(count => count + 1);
  }, [revalidate]);
  const onAccessChanged = useCallback(async (readOnly: boolean) => {
    setLiveReadOnly(readOnly);
    await revalidate();
    setLiveReadOnly(null);
  }, [revalidate]);
  const deleted = loaderData.ok && loaderData.deleted;
  const readOnly = liveReadOnly ?? (loaderData.ok && loaderData.readOnly);
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
          // Deleting or restoring closes the connection, so the editor
          // reconnects; a change of access is switched on the connection.
          key={`${params.id}:${reconnects}`}
          id={params.id}
          presence={loaderData.ok ? loaderData.presence : null}
          onTitleChange={setTitle}
          onFirstEdit={onFirstEdit}
          onAccessRevoked={onAccessRevoked}
          onAccessChanged={onAccessChanged}
          editable={!readOnly}
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
          topbarRight={loaderData.ok && loaderData.owner && !deleted
            ? (
                <SharePanel
                  documentId={params.id}
                  shared={loaderData.shared}
                  linkAccess={loaderData.linkAccess}
                  shareUrl={loaderData.shareUrl}
                  owner={loaderData.owner}
                  invited={loaderData.invited}
                  showUpgrade={!loaderData.hasSubscription}
                />
              )
            : null}
        />
      </ClientOnly>
      <Outlet />
    </>
  );
}
