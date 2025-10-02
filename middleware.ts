import type { IncomingMessage, ServerResponse } from 'http';


type Middleware = (
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  go: () => Promise<void> // go not used with for loop
) => Promise<void | ServerResponse<IncomingMessage>>;



class MiddlewareMgr {

  private middlewares: Record<string, Middleware[]> = {};

  /**
   * Register middleware for a specific path.
   * 
   * @param path URL path (ie: "/api")
   * @param middleware Middleware function
   */
  register(path: string, middleware: Middleware): void {
    if (!this.middlewares[path]) this.middlewares[path] = [];
    this.middlewares[path].push(middleware);
  };


  /**
   * Execute middlewares sequentially.
   * 
   * @returns `true` if all middlewares completed, `false` if a middleware terminated early.
   */
  async process(req: IncomingMessage, res: ServerResponse<IncomingMessage>, path: string): Promise<boolean> {
    const middlewares = this.middlewares[path] || [];

    // go() is still provided for compatibility but does nothing and will be removed.
    for (const mw of middlewares) {
      const result = await mw(req, res, async () => { });
      if (result)
        return false;
    }

    return true;
  };

};

export default MiddlewareMgr;
