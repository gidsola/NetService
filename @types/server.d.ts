import type { IncomingMessage, ServerResponse } from 'http';
import MiddlewareMgr from './middleware.js';
import Safety from './safety.js';
import type { NextCustom } from './modules/nextjs.js';
declare class Server extends MiddlewareMgr {
    private HttpsServerOptions;
    private ServiceHandler;
    private development;
    port: number;
    Safety: Safety;
    Server: import("http").Server<typeof IncomingMessage, typeof ServerResponse> | import("https").Server<typeof IncomingMessage, typeof ServerResponse>;
    private NextCustomServer;
    NextServer: NextCustom | undefined;
    NextHandler: import("next/dist/server/next.js").RequestHandler | undefined;
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
     *
     * @note This bothers me and will likely get dispersed.
     */
    private handleRequest;
}
export default Server;
//# sourceMappingURL=server.d.ts.map