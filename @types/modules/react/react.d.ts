import type { IncomingMessage, ServerResponse } from 'http';
import ReactRoute from './react-route.js';
/**
 *
 */
export type ReactCustom = {
    ReactRoute: ReactRoute;
    ReactRequestHandler: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
};
/**
 *
 */
export default class ReactCustomServer {
    ReactRoute: ReactRoute;
    ReactRequestHandler: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
    /**
     *
     * @param development
     */
    constructor(development: boolean);
    /**
     *
     */
    private devBuild;
    /**
     *
     */
    private prodBuild;
    /**
     *
     * @param entryPoints
     */
    private mapRoutes;
}
//# sourceMappingURL=react.d.ts.map