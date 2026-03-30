import { WebSocketServer } from 'ws';
import Server from './server.js';
export default class Sockets extends Server {
    wss = null;
    constructor(DOMAIN) {
        super(DOMAIN);
    }
    startWebSocketServer() {
        if (this.Server) {
            this.wss = new WebSocketServer({ server: this.Server, path: '/ws' })
                .on('connection', (ws, req) => {
                this.emit('zREADY', { client: ws, req });
                ws.on('message', (data) => {
                    this.emit('zMESSAGE', { client: ws, data });
                });
                ws.on('close', () => {
                    this.emit('zCLOSE', { client: ws });
                });
            })
                .on('error', (e) => {
                this.emit('zERROR', { error: e });
            });
        }
        else
            throw new Error('HTTP/HTTPS server not initialized');
    }
}
;
//# sourceMappingURL=sockets.js.map