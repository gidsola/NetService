import type { Server } from 'http';
import type { Server as SecureServer } from 'https';
import Next from 'next';
export type NextCustom = ReturnType<typeof Next>;
declare class NextCustomServer {
    private NextServerOptions;
    NextServer: NextCustom;
    NextRequestHandler: import("next/dist/server/next").RequestHandler;
    constructor(Server: Server | SecureServer, Dev: boolean, Domain: string, Port: number);
}
export default NextCustomServer;
//# sourceMappingURL=nextjs.d.ts.map