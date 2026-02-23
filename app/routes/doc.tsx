import type { Route } from './+types/doc';
import { getConfig } from '~/config';
import { CollaborativeEditor } from '~/components/collaborative-editor/collaborative-editor';

export function loader() {
  const config = getConfig();

  return {
    wsUrl: config.ws.url,
  };
}

export default function ({ params, loaderData }: Route.ComponentProps) {
  return (
    <>
      <title>{params.id}</title>
      <CollaborativeEditor id={params.id} wsUrl={loaderData.wsUrl} />
    </>
  );
}
