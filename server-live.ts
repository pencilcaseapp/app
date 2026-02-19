import express from 'express';
import expressWebsockets from 'express-ws';
import { createLiveServer } from '~/live';

const port = 3003;
const { app } = expressWebsockets(express());

createLiveServer(app);

app.listen(port, () => {
  console.log(`📡 Live server listening on http://localhost:${port}`);
});
