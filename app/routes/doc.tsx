import type { Route } from './+types/doc';
import { CollaborativeEditor } from '~/components/collaborative-editor/collaborative-editor';
import { getDocumentTitle } from '~/repos/document';
import { useState } from 'react';
import { ClientOnly } from '~/ui/client-only/client-only';
import { Button } from '~/ui/button/button';
import { useSidebarContext } from '~/ui/sidebar-context/use-sidebar-context';

export async function loader({ params }: Route.LoaderArgs) {
  const documentTitle = await getDocumentTitle(params.id);

  return {
    documentTitle,
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
          topbarLeft={(
            <>
              <Button
                colorLight="secondary"
                colorDark="secondary"
                icon="sidebar"
                iconTitle={isSidebarOpen ? 'Close navigation' : 'Open navigation'}
                ref={triggerRef}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              />
            </>
          )}
        />
      </ClientOnly>
    </>
  );
}
