
import type { IncomingMessage, ServerResponse } from 'http';
import type { SecureVersion } from 'tls';

import { createServer as createHttpServer } from 'http';
import { createServer as createSecureServer, Agent } from 'https';

import { EventEmitter } from 'node:events';
import { readFileSync } from 'fs';

import Next from 'next';
type NextCustom = ReturnType<typeof Next>;

import MiddlewareMgr from './middleware.js';
import { WriteAndEnd, SetHeaders } from './helpers.js';
import Safety from './safety.js';
import logger from './logger.js';

class NetService extends EventEmitter {

  private _nextServerOptions;
  private _httpsServerOptions;

  Server;
  Safety;
  MiddlewareMgr;
  NextServer: NextCustom;
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
    this.MiddlewareMgr = new MiddlewareMgr();

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

    this.ServiceHandler = this.handleRequest.bind(this);
    this.Server =
      this.development
        ? createHttpServer(this.ServiceHandler)
        : createSecureServer(this._httpsServerOptions, this.ServiceHandler);

    this.init();
  };


  private async init() {

    await this.NextServer.prepare();

    return new Promise<boolean>((resolve, reject) => {
      try {
        // re-visit the listeners
        this.Server

          .on('error', async function serviceError(e) {
            logger('@NetService').error(e instanceof Error ? e.message : e);
          })

          .on('clientError', async function clientError(e, socket) {
            socket.destroy(e);
          })

          .on('tlsClientError', async function tlsClientError(e, socket) {
            socket.destroy(e);
          })

          // commenting for now, no need to take up space.
          // .on('stream', async function rcvdStream(stream, headers) {
          //   logger().info('stream');
          // })

          .on('close', async () => {
            await this.Safety.cleanup();
          })

          .listen(this._nextServerOptions.port, () => {
            this.emit('ready');
            resolve(true);
          });
      }
      catch (e) {
        logger('@NetService').error(e instanceof Error ? e.message : e);
        this.emit('error', e);
        reject(false);
      };
    });
  };


  private async NextRequest(req: IncomingMessage, res: ServerResponse<IncomingMessage>) {
    try {
      SetHeaders(res);
      return await this.NextRequestHandler(req, res);
    }
    catch (e) {
      logger('@NetService').error(e instanceof Error ? e.message : e);
      this.emit('error', e);
      return WriteAndEnd(res, 500, 'Internal Server Error');
    };
  };


  private async handleRequest(req: IncomingMessage, res: ServerResponse<IncomingMessage>): Promise<void | ServerResponse<IncomingMessage>> {
    try {
      const url = new URL(req.url || '', `https://${req.headers.host}`);
      if (!await this.MiddlewareMgr.process(req, res, url.pathname)) return;

      await this.NextRequest(req, res);

    } catch (e) {
      logger('@NetService').error(e instanceof Error ? e.message : e);
      this.emit('error', e);
      return WriteAndEnd(res, 500, 'Internal Server Error');
    };
  };


};
export default NetService;


