import type { IncomingMessage, ServerResponse } from 'http';
import { EventEmitter } from 'node:events';
import Next from 'next';
type NextCustom = ReturnType<typeof Next>;
import MiddlewareMgr from './middleware.js';
import Safety from './safety.js';
declare class NetService extends EventEmitter {
    private _nextServerOptions;
    private _httpsServerOptions;
    Server: import("http").Server<typeof IncomingMessage, typeof ServerResponse> | import("https").Server<typeof IncomingMessage, typeof ServerResponse>;
    Safety: Safety;
    MiddlewareMgr: MiddlewareMgr;
    NextServer: NextCustom;
    development: boolean;
    private ServiceHandler;
    private NextRequestHandler;
    /**
     * Creates a Micro-NetService Server for the specified domain.
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
    private handleRequest;
}
export default NetService;
//# sourceMappingURL=netservice.d.ts.map