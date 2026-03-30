import type { IncomingMessage, ServerResponse } from 'http';
import type { NextCustom } from './modules/nextjs/nextjs.js';
import MiddlewareMgr from './middleware.js';
import Safety from './safety.js';
/**
 *
 */
declare class Server extends MiddlewareMgr {
    private HttpsServerOptions;
    private ServiceHandler;
    private development;
    NextServer: NextCustom | undefined;
    port: number;
    Safety: Safety;
    Server: import("http").Server<typeof IncomingMessage, typeof ServerResponse> | import("https").Server<typeof IncomingMessage, typeof ServerResponse>;
    private NextCustomServer;
    private NextHandler;
    private ReactCustomServer;
    private ReactHandler;
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
     * @note This bothers me still.
     */
    private handleRequest;
}
export default Server;
//# sourceMappingURL=server.d.ts.map