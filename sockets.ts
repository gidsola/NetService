import { WebSocketServer } from 'ws';
import Server from './server.js';

class Sockets extends Server {

  constructor(DOMAIN: string) {
    super(DOMAIN);

    new WebSocketServer({ server: this.Server, path: '/ws' })
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
};
export default Sockets;
