import type { Route } from './+types/doc';
import { CollaborativeEditor } from '~/components/collaborative-editor/collaborative-editor';
import { getDocumentTitle } from '~/repos/document';
import { useState } from 'react';
import { ClientOnly } from '~/ui/client-only/client-only';
import { Button } from '~/ui/button/button';
import { useSidebarContext } from '~/ui/sidebar-context/use-sidebar-context';
import { href, Link } from 'react-router';
import { getAuthenticatedUser, getSignInUrl } from '~/services/auth';

export async function loader({ params, request }: Route.LoaderArgs) {
  const user = await getAuthenticatedUser(request);
  const documentTitle = await getDocumentTitle(params.id);
  const documentUrl = href(`/doc/:id`, { id: params.id });
  const signInUrl = user ? null : getSignInUrl(documentUrl);

  return {
    documentTitle,
    signInUrl,
  };
}

export default function ({ params, loaderData }: Route.ComponentProps) {
  const [title, setTitle] = useState(loaderData.documentTitle);
  const { isSidebarOpen, setIsSidebarOpen, triggerRef } = useSidebarContext();

  return (
    <>
      <title>{title ?? 'Untitled'}</title>
      <ClientOnly>
        <CollaborativeEditor
          id={params.id}
          onTitleChange={setTitle}
          topbarLeft={
            loaderData.signInUrl
              ? (
                  <Button
                    as={Link}
                    to={loaderData.signInUrl}
                    colorLight="upgrade"
                    colorDark="upgrade"
                  >
                    Sign In
                  </Button>
                )
              : (
                  <Button
                    colorLight="secondary"
                    colorDark="secondary"
                    icon="sidebar"
                    iconTitle={isSidebarOpen ? 'Close navigation' : 'Open navigation'}
                    ref={triggerRef}
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  />
                )
          }
        />
      </ClientOnly>
    </>
  );
}
