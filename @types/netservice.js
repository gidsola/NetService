import Sockets from './sockets.js';
class NetService extends Sockets {
    constructor(DOMAIN) {
        super(DOMAIN);
        this.listen = this.listen.bind(this);
    }
    listen(port, callback) {
        return this.Server.listen(typeof port === "function" ? this.port : port, typeof port === "function" ? port : callback ? callback : undefined);
    }
    ;
}
;
export default NetService;
//# sourceMappingURL=netservice.js.map