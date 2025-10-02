class MiddlewareMgr {
    middlewares = {};
    /**
     * Register middleware for a specific path.
     *
     * @param path URL path (ie: "/api")
     * @param middleware Middleware function
     */
    register(path, middleware) {
        if (!this.middlewares[path])
            this.middlewares[path] = [];
        this.middlewares[path].push(middleware);
    }
    ;
    /**
     * Execute middlewares sequentially.
     *
     * @returns `true` if all middlewares completed, `false` if a middleware terminated early.
     */
    async process(req, res, path) {
        const middlewares = this.middlewares[path] || [];
        // go() is still provided for compatibility but does nothing and will be removed.
        for (const mw of middlewares) {
            const result = await mw(req, res, async () => { });
            if (result)
                return false;
        }
        return true;
    }
    ;
}
;
export default MiddlewareMgr;
//# sourceMappingURL=middleware.js.map