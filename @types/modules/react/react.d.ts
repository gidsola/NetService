import type { IncomingMessage, ServerResponse } from 'http';
import ReactRoute from './react-route.js';
/**
 * Only provide the ReactRoute instance and handler.
 * Do not import or execute React components in Node.js.
 */
export default class ReactCustomServer {
    ReactRoute: ReactRoute;
    ReactRequestHandler: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
    constructor(development: boolean);
    private devBuild;
    private prodBuild;
}
//# sourceMappingURL=react.d.ts.map