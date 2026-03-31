import Sockets from './sockets.js';
declare class NetService extends Sockets {
    constructor(DOMAIN: string);
    listen(port?: number, callback?: () => void): import("https").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse> | import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
}
export default NetService;
//# sourceMappingURL=netservice.d.ts.map