import type { Route } from './+types/doc';
import { CollaborativeEditor } from '~/components/collaborative-editor/collaborative-editor';
import { getDocumentTitle } from '~/repos/document';
import { useState } from 'react';
import { ClientOnly } from '~/ui/client-only/client-only';
import { Button } from '~/ui/button/button';
import { useSidebarContext } from '~/ui/sidebar-context/use-sidebar-context';
import { href, Link } from 'react-router';
import { getAuthenticatedUser } from '~/services/auth';

export async function loader({ params, request }: Route.LoaderArgs) {
  const user = await getAuthenticatedUser(request);
  const documentTitle = await getDocumentTitle(params.id);

  return {
    documentTitle,
    user,
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
            loaderData.user
              ? (
                  <Button
                    colorLight="secondary"
                    colorDark="secondary"
                    icon="sidebar"
                    iconTitle={isSidebarOpen ? 'Close navigation' : 'Open navigation'}
                    ref={triggerRef}
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  />
                )
              : (
                  <Button
                    as={Link}
                    to={href('/signin')}
                    colorLight="upgrade"
                    colorDark="upgrade"
                  >
                    Sign In
                  </Button>
                )
          }
        />
      </ClientOnly>
    </>
  );
}
