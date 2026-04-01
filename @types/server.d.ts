import type { IncomingMessage, ServerResponse } from 'http';
import MiddlewareMgr from './middleware.js';
import Safety from './safety.js';
/**
 *
 */
declare class Server extends MiddlewareMgr {
    private development;
    private HttpsServerOptions;
    private ServiceHandler;
    private ReactCustomServer;
    private ReactHandler;
    port: number;
    Server: import("https").Server<typeof IncomingMessage, typeof ServerResponse> | import("http").Server<typeof IncomingMessage, typeof ServerResponse>;
    Safety: Safety;
    /**
     * Creates a NetService Server for the specified domain.
     *
     * @param DOMAIN - The domain name for the service. If 'localhost', the service will run in development mode.
     *
     * @note If you have listening access error use the following:
     *
     *    sudo setcap 'cap_net_bind_service=+ep' `which node`
     *
     */
    constructor(DOMAIN: string);
    /**
     * Serves static files from the 'public' directory.
     * Returns true if a file was served, false otherwise.
     */
    private serveStaticFile;
    /**
     *
     * @note This bothers me still.
     */
    private handleRequest;
}
export default Server;
//# sourceMappingURL=server.d.ts.map