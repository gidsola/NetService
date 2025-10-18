import type { IncomingMessage, ServerResponse } from 'http';
import type { Server } from 'http';
import type { Server as SecureServer } from 'https';
declare class ViteCustomServer {
    private viteServer;
    constructor(server: Server | SecureServer, Dev: boolean);
    private initViteServer;
    getRequestHandler(req: IncomingMessage, res: ServerResponse): void;
}
export default ViteCustomServer;
//# sourceMappingURL=vite.d.ts.map