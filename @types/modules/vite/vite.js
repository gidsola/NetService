import { createServer as createViteServer } from 'vite';
import path from 'path';
class ViteCustomServer {
    viteServer = null;
    constructor(server, Dev) {
        if (Dev) {
            this.initViteServer(server);
        }
    }
    async initViteServer(server) {
        this.viteServer = await createViteServer({
            server: {
                middlewareMode: {
                    server: server
                },
            },
        });
    }
    ;
    getRequestHandler(req, res) {
        if (!this.viteServer) {
            throw new Error("Vite server not initialized");
        }
        return this.viteServer.middlewares(req, res);
    }
    ;
}
;
export default ViteCustomServer;
//# sourceMappingURL=vite.js.map