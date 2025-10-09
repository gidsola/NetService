import type { IncomingMessage, ServerResponse } from 'http';
import { EventEmitter } from 'node:events';

type Middleware = (
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>
) => Promise<ServerResponse<IncomingMessage> | undefined>;

class MiddlewareMgr extends EventEmitter {

  private middlewares: Record<string, Middleware[]> = {};
  private dr_allcome: Middleware[] = []; // do you know the reference 👁‍🗨 

  /**
   * Register middleware for a specific path.
   * 
   * @param path URL path (ie: "/api")
   * @param middleware Middleware function
   */
  register(path: string, middleware: Middleware): this {
    if (path === undefined || path === '') throw new Error("path cannot be empty");
    if (typeof path !== "string") throw new Error("path must be a string");
    if (typeof middleware !== "function") throw new Error("middlewares must be a function");

    if (path === '*') {
      this.dr_allcome.push(middleware);
      return this;
    };

    if (!this.middlewares[path]) this.middlewares[path] = [];
    this.middlewares[path].push(middleware);
    return this;
  };

  /**
   * Execute middlewares sequentially.
   * 
   * @returns `true` if all middlewares completed, `false` if a middleware terminated early.
   */
  async process(req: IncomingMessage, res: ServerResponse<IncomingMessage>, path: string): Promise<boolean> {

    if (this.dr_allcome)
      for await (const mw of this.dr_allcome) {
        const result = await mw(req, res);
        if (result) return false;
      };

    if (this.middlewares[path])
      for await (const mw of this.middlewares[path]) {
        const result = await mw(req, res);
        if (result) return false;
      };

    return true;
  };

};
export default MiddlewareMgr;
