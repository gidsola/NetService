import { WebSocketServer } from 'ws';
import Server from './server.js';
export default class Sockets extends Server {
    wss: WebSocketServer | null;
    constructor(DOMAIN: string);
    startWebSocketServer(): void;
}
//# sourceMappingURL=sockets.d.ts.map