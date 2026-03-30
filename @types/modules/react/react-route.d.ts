import type { IncomingMessage, ServerResponse } from 'http';
import React from 'react';
/**
 *
 */
export default class ReactRoute {
    private routes;
    use(path: string, component: React.ComponentType): void;
    /**
     *
     */
    router(req: IncomingMessage, res: ServerResponse): Promise<void>;
    /**
     *
     */
    private renderReactComponent;
}
//# sourceMappingURL=react-route.d.ts.map