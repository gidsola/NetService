
import type { IncomingMessage, ServerResponse } from 'http';
import type { SecureVersion } from 'tls';

import { createServer as createHttpServer } from 'http';
import { createServer as createSecureServer, Agent } from 'https';

import { EventEmitter } from 'node:events';
import { readFileSync } from 'fs';

import Next from 'next';
// import type { NextServer } from 'next/dist/server/next';
type NextCustom = ReturnType<typeof Next>;

import Safety, { WriteAndEnd } from './safety.js';
import logger from './logger.js';

class NetService extends EventEmitter {

  private _nextServerOptions;
  private _httpsServerOptions;

  NextServer: NextCustom;
  Service;
  Safety;
  development;

  private ServiceHandler;
  private NextRequestHandler;

  /**
   * Creates a Micro-NetService Server for the specified domain.
   * 
   * @param DOMAIN - The domain name for the service. If 'localhost', the service will run in development mode.
   * 
   * @note If you have listening access error use the following:
   * 
   *    sudo setcap 'cap_net_bind_service=+ep' `which node`
   * 
   */
  constructor(DOMAIN: string) {
    super();

    this.Safety = new Safety();
    this.development = DOMAIN === 'localhost';

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
      ciphers: process.env.TLS_CIPHERS ?? "TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA",
      maxVersion: process.env.TLS_MAXVERSION as SecureVersion ?? "TLSv1.3",
      minVersion: process.env.TLS_MINVERSION as SecureVersion ?? "TLSv1.2",
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
    this.Service =
      this.development
        ? createHttpServer(this.ServiceHandler)
        : createSecureServer(this._httpsServerOptions, this.ServiceHandler);

    this.init();
  };


  private async init() {

    await this.NextServer.prepare();

    await new Promise((resolve, reject) => {
      try {
        // re-visit the listeners
        this.Service
          .on('error', async function serviceError(e) {
            // todo
            logger('@NetService').error(e instanceof Error ? e.message : e);
          })
          .on('clientError', async function clientError(e, socket) {
            socket.destroy(e);
          })
          .on('tlsClientError', async function tlsClientError(e, socket) {
            socket.destroy(e);
          })
          // todo
          .on('stream', async function rcvdStream(stream, headers) {
            logger().info('stream');
          })
          .listen(this._nextServerOptions.port, () => {
            this.emit('ready');
            resolve;
          });
      }
      catch (e) {
        logger('@NetService').error(e instanceof Error ? e.message : e);
        this.emit('error', e);
        reject;
      }
    });
  };


  private async NextRequest(req: IncomingMessage, res: ServerResponse<IncomingMessage>) {
    try {
      setHeaders(res);
      return await this.NextRequestHandler(req, res);
    }
    catch (e) {
      logger('@NetService').error(e instanceof Error ? e.message : e);
      this.emit('error', e);
      return WriteAndEnd(res, 500, 'Internal Server Error');
    };
  };


  private async processRequest(req: IncomingMessage, res: ServerResponse<IncomingMessage>) {
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
      logger('@NetService').error(e instanceof Error ? e.message : e);
      this.emit('error', e);
      return WriteAndEnd(res, 500, 'Internal Server Error');
    };
  };


  private async ServiceResponseHandler(req: IncomingMessage, res: ServerResponse<IncomingMessage>): Promise<void | ServerResponse<IncomingMessage>> {
    try {
      const allowedResponse = await this.Safety.isAllowed(req, res);
      return typeof allowedResponse === 'boolean'
        ? await this.processRequest(req, res)
        : allowedResponse;

    } catch (e) {
      logger('@NetService').error(e instanceof Error ? e.message : e);
      this.emit('error', e);
      return WriteAndEnd(res, 500, 'Internal Server Error');
    };
  };

};
export default NetService;



function setHeaders(res: ServerResponse<IncomingMessage>) {
  // gotta be a better way..
  // def need to re-visit these, locale to start. permissions etc, need to be adjustable per user.
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
