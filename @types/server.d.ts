import type { IncomingMessage, ServerResponse } from 'http';
import type { NextCustom } from './modules/nextjs/nextjs.js';
import MiddlewareMgr from './middleware.js';
import Safety from './safety.js';
/**
 *
 */
declare class Server extends MiddlewareMgr {
    private development;
    private HttpsServerOptions;
    private ServiceHandler;
    private NextCustomServer;
    private NextHandler;
    private ReactCustomServer;
    private ReactHandler;
    handleReactRequest(req: IncomingMessage, res: ServerResponse): Promise<void>;
    use(path: string, component: React.ComponentType): void;
    port: number;
    Server: import("http").Server<typeof IncomingMessage, typeof ServerResponse> | import("https").Server<typeof IncomingMessage, typeof ServerResponse>;
    NextServer: NextCustom | undefined;
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
     *
     * @note This bothers me still.
     */
    private handleRequest;
}
export default Server;
//# sourceMappingURL=server.d.ts.map