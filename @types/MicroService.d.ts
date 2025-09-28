import type { IncomingMessage, ServerResponse } from 'http';
import { EventEmitter } from 'node:events';
import Safety from './safety.js';
declare class MicroService extends EventEmitter {
    private NextServer;
    private _nextServerOptions;
    private _httpsServerOptions;
    NetService: import("http").Server<typeof IncomingMessage, typeof ServerResponse> | import("https").Server<typeof IncomingMessage, typeof ServerResponse>;
    Safety: Safety;
    development: boolean;
    private ServiceHandler;
    private NextRequestHandler;
    /**
     * Creates a MicroService Server for the specified domain.
     *
     * @param DOMAIN - The domain name for the service. If 'localhost', the service will run in development mode.
     *
     * @note If you have listening access error use the following:
     *
     *    sudo setcap 'cap_net_bind_service=+ep' `which node`
     *
     */
    constructor(DOMAIN: string);
    private init;
    private NextRequest;
    private processRequest;
    private ServiceResponseHandler;
}
export default MicroService;
//# sourceMappingURL=MicroService.d.ts.map