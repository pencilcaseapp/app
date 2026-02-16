import { useSocket } from '~/hooks/use-socket';
import type { Route } from './+types/doc';
import { getConfig } from '~/config';

export function loader() {
  const config = getConfig();

  return {
    socketUrl: config.socket.url,
  };
}

export default function ({ params, loaderData }: Route.ComponentProps) {
  const { users } = useSocket({ url: loaderData.socketUrl, docId: params.id });

  return (
    <>
      <title>{params.id}</title>
      Currently connected users:
      <ul>
        {users.map(user => (
          <li key={user}>{user}</li>
        ))}
      </ul>
    </>
  );
}
