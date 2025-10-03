import type { IncomingMessage, ServerResponse } from 'http';
type Middleware = (req: IncomingMessage, res: ServerResponse<IncomingMessage>) => Promise<ServerResponse<IncomingMessage> | undefined>;
declare class MiddlewareMgr {
    private middlewares;
    private dr_allcome;
    /**
     * Register middleware for a specific path.
     *
     * @param path URL path (ie: "/api")
     * @param middleware Middleware function
     */
    register(path: string, middleware: Middleware): this;
    /**
     * Execute middlewares sequentially.
     *
     * @returns `true` if all middlewares completed, `false` if a middleware terminated early.
     */
    process(req: IncomingMessage, res: ServerResponse<IncomingMessage>, path: string): Promise<boolean>;
}
export default MiddlewareMgr;
//# sourceMappingURL=middleware.d.ts.map