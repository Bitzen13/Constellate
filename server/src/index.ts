import { WebSocketServer } from 'ws';
import { DEFAULT_PORT } from '@constellate/shared';

// Phase 2 replaces this stub with the authoritative simulation (see ROADMAP.md).

const port = Number(process.env.PORT) || DEFAULT_PORT;
const wss = new WebSocketServer({ port });

wss.on('connection', (socket) => {
  console.log('client connected');
  socket.on('close', () => console.log('client disconnected'));
});

console.log(`constellate server listening on :${port}`);
