
import type { Server } from 'http';
import type { Server as SecureServer } from 'https';
import Next from 'next';
export type NextCustom = ReturnType<typeof Next>;

class NextCustomServer {

    private NextServerOptions;
    NextServer: NextCustom;
    NextRequestHandler;

    constructor(Server: Server | SecureServer, Dev: boolean, Domain: string, Port: number) {
        this.NextServerOptions = {
            customServer: true,
            dev: Dev,
            hostname: Domain,
            port: Port,
            httpServer: Server,
            experimentalTestProxy: false,
            experimentalHttpsServer: false,
            minimalMode: true,
            quiet: !Dev
        };
        this.NextServer = Next(this.NextServerOptions);
        this.NextRequestHandler = this.NextServer.getRequestHandler();
        this.NextServer.prepare();
    }
};
export default NextCustomServer;
