import { createServer } from 'node:http';
import { createLiveServer } from '~/live';

const port = 3003;
const server = createServer();

createLiveServer(server);

server.listen(port, () => {
  console.log(`Live server listening on http://localhost:${port}`);
});
