import { createServer as createHttpServer } from 'http';
import { createServer as createSecureServer, Agent } from 'https';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'fs';
import Next from 'next';
import Safety from './safety.js';
import logger from './logger.js';
class MicroService extends EventEmitter {
    NetService;
    NextServer;
    Safety;
    ServiceHandler;
    development;
    _nextServerOptions;
    _httpsServerOptions;
    /**
     * @private
     */
    NextRequestHandler;
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
    constructor(DOMAIN) {
        super();
        this.Safety = new Safety();
        /**@type {boolean} */
        this.development = process.env.DEV === DOMAIN;
        this._nextServerOptions = {
            rejectUnauthorized: false,
            customServer: true,
            dev: this.development,
            hostname: DOMAIN,
            port: this.development ? 80 : 443,
            agent: {}
        };
        this._httpsServerOptions = {
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
            rejectUnauthorized: false,
            insecureHTTPParser: false,
            ciphers: process.env.TLS_CIPHERS,
            maxVersion: process.env.TLS_MAXVERSION,
            minVersion: process.env.TLS_MINVERSION,
            enableTrace: false,
            requestTimeout: 30000,
            sessionTimeout: 120000,
            agent: {}
        };
        this._httpsServerOptions.agent = new Agent(this._httpsServerOptions);
        this._nextServerOptions.agent = new Agent(this._nextServerOptions);
        this.NextServer = Next(this._nextServerOptions);
        this.NextRequestHandler = this.NextServer.getRequestHandler();
        this.ServiceHandler = this.ServiceResponseHandler.bind(this);
        this.NetService =
            this.development
                ? createHttpServer(this.ServiceHandler)
                : createSecureServer(this._httpsServerOptions, this.ServiceHandler);
        this.init();
    }
    ;
    /**
     * @private
     */
    async init() {
        await this.Safety.maintenance();
        await this.NextServer.prepare();
        await new Promise((resolve) => {
            // re-visit the listeners
            this.NetService
                .on('error', async function serviceError(err) {
                // todo
                logger().error('NetService Error:', err);
            })
                .on('clientError', async function clientError(err, socket) {
                socket.destroy(err);
            })
                .on('tlsClientError', async function tlsClientError(err, socket) {
                socket.destroy(err);
            })
                // todo
                .on('stream', async function rcvdStream(stream, headers) {
                logger().info('stream');
            })
                .listen(this._nextServerOptions.port, () => resolve);
        });
        this.emit('ready');
    }
    ;
    /**
     * @param {IncomingMessage} req
     * @param {ServerResponse<IncomingMessage>} res
     *
     * @private
     */
    async NextRequest(req, res) {
        try {
            setHeaders(res);
            return await this.NextRequestHandler(req, res);
        }
        catch (e) {
            console.error(e);
            logger().error('Error handling web request:', e);
            return this.Safety.WriteAndEnd(res, 500, 'Internal Server Error');
        }
        ;
    }
    ;
    /**
     * @param {IncomingMessage} req
     * @param {ServerResponse<IncomingMessage>} res
     *
     * @private
     */
    async processRequest(req, res) {
        try {
            // const url = new URL(req.url || '', `https://${req.headers.host}`);
            // if (url.pathname.startsWith("/v1/")) {
            //   return WriteAndEnd(res, 403, `Access Denied`);
            //   if (endpoints[url.pathname])
            //     await endpoints[url.pathname](req, res);
            //   else {
            //     res.writeHead(200, { 'Content-Type': 'application/json' });
            //     res.end('Hello nosey o,O');
            //   };
            // };
            return await this.NextRequest(req, res);
        }
        catch (e) {
            logger().error(e);
            return this.Safety.WriteAndEnd(res, 500, 'Internal Server Error');
        }
        ;
    }
    ;
    /**
     * @param {IncomingMessage} req
     * @param {ServerResponse<IncomingMessage>} res
     *
     * @private
     * @returns {Promise<void | ServerResponse<IncomingMessage>>}
     */
    async ServiceResponseHandler(req, res) {
        try {
            const allowedResponse = await this.Safety.isAllowed(req, res);
            return typeof allowedResponse === 'boolean'
                ? await this.processRequest(req, res)
                : allowedResponse;
        }
        catch (e) {
            logger().error('Error:', e);
            console.log(e);
            return this.Safety.WriteAndEnd(res, 500, 'Internal Server Error');
        }
        ;
    }
    ;
}
;
export default MicroService;
/**
 * @param {ServerResponse<IncomingMessage>} res
 *
 * @private
 */
function setHeaders(res) {
    // gotta be a better way..
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' https://cdn.jsdelivr.net https://fonts.gstatic.com; img-src 'self' https://avatars.githubusercontent.com/ https://authjs.dev https://raw.githubusercontent.com https://github.com https://cdn.discordapp.com data: https://www.google-analytics.com https://www.googleadservices.com; frame-src 'self' https://www.google.com https://www.googleadservices.com https://www.google-analytics.com https://www.googleadservices.com; base-uri 'none'; form-action 'self'; frame-ancestors 'none';");
    res.setHeader('Permissions-Policy', "geolocation=(), midi=(), sync-xhr=(), microphone=(), camera=(), magnetometer=(), gyroscope=(), fullscreen=(self), payment=()");
    res.setHeader('Feature-Policy', "geolocation 'none'; midi 'none'; sync-xhr 'none'; microphone 'none'; camera 'none'; magnetometer 'none'; gyroscope 'none'; fullscreen 'self'; payment 'none';");
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('Content-Language', 'en-US');
    res.setHeader('Connection', 'close');
}
;
//# sourceMappingURL=MicroService.js.map