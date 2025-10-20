
import type { IncomingMessage, ServerResponse } from 'http';
import React from 'react';
import { renderToPipeableStream } from 'react-dom/server';

type Route = {
  path: string;
  component: React.ComponentType;
};

/**
 * 
 */
export default class ReactRoute {

  private routes: Route[] = [];

  public use(path: string, component: React.ComponentType): void {
    this.routes.push({ path, component });
  };

  /**
   * 
   */
  public async router(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url || '', `https://${req.headers.host}`);
    const route = this.routes.find((r) => r.path === url.pathname);
    if (route) {
      // res.setHeader('Content-Type', 'text/html');
      // res.write(`<!DOCTYPE html><html><body><div id="root">`);
      await this.renderReactComponent(React.createElement(route.component), res);
      // res.end(`</div></body></html>`);
    }
    else {
      res.statusCode = 404;
      res.end('<h1>404 Not Found</h1>');
    };
  };

  /**
   * 
   */
  private async renderReactComponent(element: React.ReactElement, res: ServerResponse): Promise<void> {
    return new Promise((resolve, reject) => {

      const { pipe, abort } = renderToPipeableStream(element, {

        bootstrapScripts: ['/main.js'],
        onShellReady() {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'text/html');
          pipe(res);
        },
        onShellError(error) {
          res.statusCode = 500;
          res.end('<h1>500 Internal Server Error</h1>');
          reject(error);
        },
        onAllReady() {
          resolve();
        },
        onError(error) {
          reject(error);
        }

      });

      setTimeout(() => {
        abort();
      }, 10000);

    });
  };


};
