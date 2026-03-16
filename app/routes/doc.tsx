import type { Route } from './+types/doc';
import { getConfig } from '~/config';
import { CollaborativeEditor } from '~/components/collaborative-editor/collaborative-editor';
import { getDocumentTitle } from '~/repos/document';
import { useState } from 'react';

export async function loader({ params }: Route.LoaderArgs) {
  const config = getConfig();
  const documentTitle = await getDocumentTitle(params.id);

  return {
    wsUrl: config.ws.url,
    documentTitle,
  };
}

export default function ({ params, loaderData }: Route.ComponentProps) {
  const [title, setTitle] = useState(loaderData.documentTitle);

  const handleTitleChange = (newTitle: string | null) => {
    setTitle(newTitle);
  };

  return (
    <>
      <title>{title ?? 'Untitled'}</title>
      <CollaborativeEditor
        id={params.id}
        wsUrl={loaderData.wsUrl}
        onTitleChange={handleTitleChange}
      />
    </>
  );
}
