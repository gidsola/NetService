import Next from 'next';
class NextCustomServer {
    NextServerOptions;
    NextServer;
    NextRequestHandler;
    constructor(Server, Dev, Domain, Port) {
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
}
;
export default NextCustomServer;
//# sourceMappingURL=nextjs.js.map