import { readFileSync, existsSync } from 'fs';
import { createServer as createHttpServer } from 'http';
import { createServer as createSecureServer, Agent } from 'https';
import path from 'path';
import ReactCustomServer from './modules/react/react.js';
import MiddlewareMgr from './middleware.js';
import { WriteAndEnd, SetHeaders } from './utils/helpers.js';
import Safety from './safety.js';
/**
 *
 */
class Server extends MiddlewareMgr {
    development;
    HttpsServerOptions;
    ServiceHandler;
    ReactCustomServer;
    ReactHandler;
    async handleReactRequest(req, res) {
        if (this.ReactHandler) {
            return await this.ReactHandler(req, res);
        }
        else {
            throw new Error('React handler not enabled');
        }
    }
    use(path, component) {
        if (this.ReactCustomServer) {
            this.ReactCustomServer.ReactRoute.use(path, component);
        }
        else {
            throw new Error('React handler not enabled');
        }
    }
    port;
    Server;
    Safety;
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
        this.ServiceHandler = this.handleRequest.bind(this);
        if (!this.development) {
            if (!process.env.DIR_SSL) {
                throw new Error("DIR_SSL environment variable is not set. Please set it to the directory containing your SSL certificate files.");
            }
            this.HttpsServerOptions = {
                key: readFileSync(process.env.DIR_SSL + 'private.key'),
                cert: readFileSync(process.env.DIR_SSL + 'certificate.crt'),
                ca: [readFileSync(process.env.DIR_SSL + 'ca_bundle.crt')],
                keepAlive: false,
                requestCert: false,
                rejectUnauthorized: true,
                insecureHTTPParser: false,
                ciphers: process.env.TLS_CIPHERS ||
                    "TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA",
                maxVersion: process.env.TLS_MAXVERSION || 'TLSv1.3',
                minVersion: process.env.TLS_MINVERSION || 'TLSv1.2',
                enableTrace: false,
                requestTimeout: 30000,
                sessionTimeout: 120000,
                agent: {},
            };
            this.HttpsServerOptions.agent = new Agent(this.HttpsServerOptions);
            this.Server = createSecureServer(this.HttpsServerOptions, this.ServiceHandler);
        }
        else {
            this.Server = createHttpServer(this.ServiceHandler);
        }
        this.Safety = new Safety();
        this.ReactCustomServer = new ReactCustomServer(this.development);
        this.ReactHandler = this.ReactCustomServer.ReactRequestHandler.bind(this);
    }
    /**
     * Serves static files from the 'public' directory.
     * Returns true if a file was served, false otherwise.
     */
    serveStaticFile(req, res) {
        const url = new URL(req.url || '', `https://${req.headers.host}`);
        const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
        const filePath = path.join(process.cwd(), 'public', pathname);
        if (existsSync(filePath) &&
            filePath.startsWith(path.join(process.cwd(), 'public'))) {
            try {
                const content = readFileSync(filePath);
                const ext = path.extname(filePath);
                const contentType = ext === '.js'
                    ? 'application/javascript'
                    : ext === '.css'
                        ? 'text/css'
                        : 'text/html';
                res.setHeader('Content-Type', contentType);
                res.writeHead(200);
                res.end(content);
                return true;
            }
            catch (e) {
                console.error('Error serving static file:', e);
            }
        }
        return false;
    }
    /**
     *
     * @note This bothers me still.
     */
    async handleRequest(req, res) {
        try {
            const url = new URL(req.url || '', `https://${req.headers.host}`);
            if (!(await this.process(req, res, url.pathname)))
                return;
            // Serve static files first
            if (this.serveStaticFile(req, res))
                return;
            if (this.ReactHandler) {
                console.log('Handling React request for:', url.pathname);
                await this.ReactHandler(req, res);
            }
            else {
                throw new Error(`No handler found for ${url.pathname}`);
            }
        }
        catch (e) {
            this.emit('error', e);
            return WriteAndEnd(res, 500, 'Internal Server Error');
        }
    }
}
export default Server;
//# sourceMappingURL=server.js.map