import Sockets from './sockets.js';

class NetService extends Sockets {
    constructor(DOMAIN: string) {
        super(DOMAIN);
        this.listen = this.listen.bind(this);
    }

    listen(port?: number, callback?: () => void) {
        return this.Server.listen(
            typeof port === "function" ? this.port : port,
            typeof port === "function" ? port : callback ? callback : undefined
        );
    };
};
export default NetService;
