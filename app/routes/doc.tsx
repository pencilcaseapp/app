import type { Route } from './+types/doc';
import { CollaborativeEditor } from '~/components/collaborative-editor/collaborative-editor';
import { getDocumentTitle } from '~/repos/document';
import { useState } from 'react';
import { ClientOnly } from '~/ui/client-only/client-only';

export async function loader({ params }: Route.LoaderArgs) {
  const documentTitle = await getDocumentTitle(params.id);

  return {
    documentTitle,
  };
}

export default function ({ params, loaderData }: Route.ComponentProps) {
  const [title, setTitle] = useState(loaderData.documentTitle);

  return (
    <>
      <title>{title ?? 'Untitled'}</title>
      <ClientOnly>
        <CollaborativeEditor
          id={params.id}
          onTitleChange={setTitle}
        />
      </ClientOnly>
    </>
  );
}
