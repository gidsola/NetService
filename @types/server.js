import { createServer as createHttpServer } from 'http';
import { createServer as createSecureServer, Agent } from 'https';
import { readFileSync } from 'fs';
import MiddlewareMgr from './middleware.js';
import Safety from './safety.js';
import NextCustomServer from './modules/nextjs.js';
import { WriteAndEnd, SetHeaders } from './helpers.js';
class Server extends MiddlewareMgr {
    HttpsServerOptions;
    ServiceHandler;
    development;
    port;
    Safety;
    Server;
    NextCustomServer;
    NextServer;
    NextHandler;
    /**
     * Creates a NetService Server for the specified domain.
     *
     * @param DOMAIN - The domain name for the service. If 'localhost', the service will run in development mode.
     *
     * @note If you have listening access error use the following:
     *
     *    sudo setcap 'cap_net_bind_service=+ep' `which node`
     *
     */
    constructor(DOMAIN) {
        super();
        this.development = DOMAIN === 'localhost';
        this.port = this.development ? 80 : 443;
        this.HttpsServerOptions = {
            key: this.development
                ? readFileSync(process.env.DIR_SSL + "localhost.key")
                : readFileSync(process.env.DIR_SSL + "private.key"),
            cert: this.development
                ? readFileSync(process.env.DIR_SSL + "localhost.crt")
                : readFileSync(process.env.DIR_SSL + "certificate.crt"),
            ca: this.development
                ? undefined
                : [readFileSync(process.env.DIR_SSL + "ca_bundle.crt")],
            keepAlive: false,
            requestCert: false,
            rejectUnauthorized: this.development ? false : true,
            insecureHTTPParser: false,
            ciphers: process.env.TLS_CIPHERS ?? "TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA",
            maxVersion: process.env.TLS_MAXVERSION ?? "TLSv1.3",
            minVersion: process.env.TLS_MINVERSION ?? "TLSv1.2",
            enableTrace: false,
            requestTimeout: 30000,
            sessionTimeout: 120000,
            agent: {}
        };
        this.HttpsServerOptions.agent = new Agent(this.HttpsServerOptions);
        this.ServiceHandler = this.handleRequest.bind(this);
        this.Server =
            this.development
                ? createHttpServer(this.ServiceHandler)
                : createSecureServer(this.HttpsServerOptions, this.ServiceHandler);
        this.Safety = new Safety();
        process.env.ENABLE_NEXTJS === "true" ? (this.NextCustomServer = new NextCustomServer(this.Server, this.development, DOMAIN, this.port),
            this.NextServer = this.NextCustomServer.NextServer,
            this.NextHandler = this.NextCustomServer.NextRequestHandler.bind(this)) : this.NextHandler = undefined;
    }
    ;
    /**
     *
     * @note This bothers me and will likely get dispersed.
     */
    async handleRequest(req, res) {
        try {
            const url = new URL(req.url || '', `https://${req.headers.host}`);
            if (!await this.process(req, res, url.pathname))
                return;
            if (this.NextHandler) {
                SetHeaders(res);
                await this.NextHandler(req, res);
            }
            else
                throw new Error(`(--no-handler-- NextJS not Enabled. Please set 'ENABLE_NEXTJS === "true"' in your .env file.`);
        }
        catch (e) {
            this.emit('error', e);
            return WriteAndEnd(res, 500, 'Internal Server Error');
        }
        ;
    }
    ;
}
;
export default Server;
//# sourceMappingURL=server.js.map