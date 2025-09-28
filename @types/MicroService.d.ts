import type { IncomingMessage, ServerResponse } from 'http';
import { EventEmitter } from 'node:events';
import Safety from './safety';
declare class MicroService extends EventEmitter {
    NetService: import("http").Server<typeof IncomingMessage, typeof ServerResponse> | import("https").Server<typeof IncomingMessage, typeof ServerResponse>;
    private NextServer;
    Safety: Safety;
    private ServiceHandler;
    development: boolean;
    private _nextServerOptions;
    private _httpsServerOptions;
    /**
     * @private
     */
    NextRequestHandler: import("next/dist/server/next").RequestHandler;
    /**
     * Creates a MicroService Server for the specified domain.
     *
     * @param {string} DOMAIN - The domain name for the service. If 'localhost', the service will run in development mode.
     *
     * @note If you have listening access error use the following:
     *
     *    sudo setcap 'cap_net_bind_service=+ep' `which node`
     *
     */
    constructor(DOMAIN: string);
    /**
     * @private
     */
    init(): Promise<void>;
    /**
     * @param {IncomingMessage} req
     * @param {ServerResponse<IncomingMessage>} res
     *
     * @private
     */
    NextRequest(req: IncomingMessage, res: ServerResponse<IncomingMessage>): Promise<void | ServerResponse<IncomingMessage>>;
    /**
     * @param {IncomingMessage} req
     * @param {ServerResponse<IncomingMessage>} res
     *
     * @private
     */
    processRequest(req: IncomingMessage, res: ServerResponse<IncomingMessage>): Promise<void | ServerResponse<IncomingMessage>>;
    /**
     * @param {IncomingMessage} req
     * @param {ServerResponse<IncomingMessage>} res
     *
     * @private
     * @returns {Promise<void | ServerResponse<IncomingMessage>>}
     */
    ServiceResponseHandler(req: IncomingMessage, res: ServerResponse<IncomingMessage>): Promise<void | ServerResponse<IncomingMessage>>;
}
export default MicroService;
//# sourceMappingURL=MicroService.d.ts.map