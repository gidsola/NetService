
import type { IncomingMessage, ServerResponse } from 'http';
import type { SecureVersion } from 'tls';
import type { NextCustom } from './modules/nextjs/nextjs.js';

import { readFileSync } from 'fs';
import { createServer as createHttpServer } from 'http';
import { createServer as createSecureServer, Agent } from 'https';

import NextCustomServer from './modules/nextjs/nextjs.js';
import ReactCustomServer from './modules/react/react.js';
import MiddlewareMgr from './middleware.js';

import { WriteAndEnd, SetHeaders } from './utils/helpers.js';
import Safety from './safety.js';

/**
 * 
 */
class Server extends MiddlewareMgr {

  private HttpsServerOptions;
  private ServiceHandler;
  private development;
  port;
  Safety;
  Server;

  private NextCustomServer;
  NextServer: NextCustom | undefined;
  NextHandler;

  private ReactCustomServer;
  ReactHandler;

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
  constructor(DOMAIN: string) {
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
      ciphers: process.env.TLS_CIPHERS || "TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA",
      maxVersion: process.env.TLS_MAXVERSION as SecureVersion || "TLSv1.3",
      minVersion: process.env.TLS_MINVERSION as SecureVersion || "TLSv1.2",
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

    process.env.ENABLE_NEXTJS === "true" ? (
      this.NextCustomServer = new NextCustomServer(this.Server, this.development, DOMAIN, this.port),
      this.NextServer = this.NextCustomServer.NextServer,
      this.NextHandler = this.NextCustomServer.NextRequestHandler.bind(this)
    ) : this.NextHandler = undefined;

    process.env.ENABLE_REACT === "true" ? (
      this.ReactCustomServer = new ReactCustomServer(this.development),
      this.ReactHandler = this.ReactCustomServer.ReactRequestHandler.bind(this)
    ) : this.ReactHandler = undefined;

  };

  /**
   * 
   * @note This bothers me still.
   */
  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void | ServerResponse> {
    try {
      const url = new URL(req.url || '', `https://${req.headers.host}`);
      if (!await this.process(req, res, url.pathname)) return;

      if (this.NextHandler) {
        SetHeaders(res);
        await this.NextHandler(req, res);
      }
      else if (this.ReactHandler) {
        console.log("doing react");
        SetHeaders(res);
        await this.ReactHandler(req, res);
      }
      else throw new Error(`(--no-handler-- Please enable a web handler via your environment.`)

    } catch (e) {
      this.emit('error', e);
      return WriteAndEnd(res, 500, 'Internal Server Error');
    };
  };

};
export default Server;
