
import { createServer as createHttpServer, IncomingMessage, ServerResponse } from 'http';
import { createServer as createSecureServer, Agent } from 'https';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'fs';
// import { URL } from 'url';
import Next from 'next';

import { isBlocked, isRateLimited } from './safety.mjs';
import logger from './logger.mjs';

class MicroService extends EventEmitter {
  NetService;
  NextServer;
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

    this.development = DOMAIN === 'localhost';

    this._nextServerOptions = {
      rejectUnauthorized: false,
      customServer: true,
      dev: this.development,
      hostname: DOMAIN,
      port: this.development ? 80 : 443
    };

    this._httpsServerOptions = {
      key: this.development
        ? readFileSync(process.cwd() + `/main/ssl/localhost.key`)
        : readFileSync(process.cwd() + `/main/ssl/private.key`),

      cert: this.development
        ? readFileSync(process.cwd() + `/main/ssl/localhost.crt`)
        : readFileSync(process.cwd() + `/main/ssl/certificate.crt`),

      ca: this.development
        ? undefined
        : [readFileSync(process.cwd() + `/main/ssl/ca_bundle.crt`)],

      keepAlive: false,
      requestCert: false,
      rejectUnauthorized: false,
      insecureHTTPParser: false,
      ciphers: "TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA",
      maxVersion: "TLSv1.3",
      minVersion: "TLSv1.2",
      enableTrace: false,
      requestTimeout: 30000,
      sessionTimeout: 120000
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
  };


  /**
   * @private
   */
  async init() {
    await this.NextServer.prepare();
    await new Promise((resolve) => {

      // re-visit the listeners
      this.NetService
        .on('error', async function serviceError(err) {
          // todo
          logger.error('NetService Error:', err);
        })
        .on('clientError', async function clientError(err, socket) {
          socket.destroy(err);
        })
        .on('tlsClientError', async function tlsClientError(err, socket) {
          socket.destroy(err);
        })
        // todo
        .on('stream', async function rcvdStream(stream, headers) {
          logger.info('stream');
        })
        .listen(this._nextServerOptions.port, resolve);

    });
    this.emit('ready');
  };


  /**
   * @param {IncomingMessage} req
   * @param {ServerResponse} res
   *
   * @private
   */
  async NextRequest(req, res) {
    try {
      setHeaders(res);
      return await this.NextRequestHandler(req, res);
    } catch (e) {
      console.error(e);
      logger.error('Error handling web request:', e);
      return WriteAndEnd(res, 500, 'Internal Server Error');
    };
  };


  /**
   * @param {IncomingMessage} req
   * @param {ServerResponse} res
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
      logger.error(e);
      return WriteAndEnd(res, 500, 'Internal Server Error');
    };
  };


  /**
   * @param {IncomingMessage} req
   * @param {ServerResponse} res
   *
   * @private
   */
  async isAllowed(req, res) {
    try {
      if (!req.method || !req.url) return res.end();
      // if (await isBlocked(req.method, req.socket.remoteAddress, req.url)) {
      //   console.log("ms");
      //   return WriteAndEnd(res, 403, `Access Denied`);
      // }
      // if (await isRateLimited(req.method, req.headers['x-forwarded-for'] /*as string*/ || req.socket.remoteAddress, req.url)) {
      //   return WriteAndEnd(res, 429, 'Too many requests');
      // }
      return true;

    } catch (e) {
      logger.error(e);
      return WriteAndEnd(res, 500, 'Internal Server Error');
    };
  };


  /**
   * @param {IncomingMessage} req
   * @param {ServerResponse} res
   *
   * @private
   */
  async ServiceResponseHandler(req, res) {
    try {
      const allowedResponse = await this.isAllowed(req, res);
      return typeof allowedResponse === 'boolean'
        ? await this.processRequest(req, res)
        : allowedResponse;

    } catch (e) {
      logger.error('Error:', e);
      console.log(e);
      return WriteAndEnd(res, 500, 'Internal Server Error');
    };
  };

};
export default MicroService;


/**
 * @param {ServerResponse} res
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
};


/**
 * @param {ServerResponse} res
 * @param {number} statusCode
 * @param {string} message
 *
 * @private
 */
function WriteAndEnd(res, statusCode, message) {
  return res
    .writeHead(statusCode, {
      'Content-Length': Buffer.byteLength(message),
      'Content-Type': 'text/plain'
    })
    .end(message);
};
