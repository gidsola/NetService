import { IncomingMessage, ServerResponse } from 'http';
import logger from './logger.js';
import chalk from 'chalk';
// type Response = ServerResponse<IncomingMessage>; // using Response for a name was dumb...
class Safety {
    urlBlockList;
    ipBlockList = new Map();
    RateLimitBucket = new Map();
    RATE_LIMIT;
    INACTIVITY_LENGTH;
    BAN_LENGTH;
    SWEEP_INTERVAL;
    SWEEP_TIMER;
    constructor() {
        this.urlBlockList = [{ url: "/admin" }]; // don't forget when setting other mws
        this.RATE_LIMIT = 10;
        this.INACTIVITY_LENGTH = 10000;
        this.BAN_LENGTH = 300000;
        this.SWEEP_INTERVAL = 60000;
        this.SWEEP_TIMER = setInterval(async () => {
            try {
                if (process.env.DEBUG === "true")
                    logger('@MAINTENANCE').info("Grabbin a broom...");
                await this.broom();
            }
            catch (e) {
                logger('@SAFETY').error('Broom failed:' + e);
            }
        }, this.SWEEP_INTERVAL);
    }
    logAccess(type, method, address, url, a = null) {
        const msgString = () => `${chalk.bgBlueBright(address)}: (Method: ${method}, URL: ${chalk.bgBlue(url)}`, blockType = {
            "url": () => logger("@SAFETY").warn(`[${chalk.bgRedBright("[BLOCKED URL]")}] => ${msgString()}\n`),
            "ip": () => logger("@SAFETY").warn(`[${chalk.bgRedBright("[BLOCKED IP]")}] => ${msgString()}\n`),
            "ban": (a) => logger("@SAFETY").warn(`[${chalk.bgRedBright("BANNED")}] => ${chalk.bgBlueBright(address)} until ${a}\n`)
        };
        blockType[type] ? blockType[type](a) : logger("@SYSTEM").warn("Unknown Access Log Type..");
    }
    ;
    async isBlocked(method, address, url) {
        try {
            const now = Date.now();
            if (this.urlBlockList.some((x) => url === x.url)) {
                this.logAccess("url", method, address, url);
                return true;
            }
            ;
            const ipBanData = this.ipBlockList.get(address);
            if (ipBanData && ipBanData.banExpiry > now) {
                this.logAccess("ip", method, address, url);
                return true;
            }
            ;
            return false;
        }
        catch (e) {
            return true; // just incase the fail is due to the user.// think about this
        }
        ;
    }
    ;
    async setIPBlock(method, address, url, banData) {
        try {
            this.ipBlockList.set(address, { ...banData });
            this.logAccess("ip", method, address, url);
            return true;
        }
        catch (e) {
            logger('@SAFETY').error(e instanceof Error ? e.message : e);
            return false;
        }
        ;
    }
    ;
    async isRateLimited(method, address, url) {
        try {
            const now = Date.now(), key = address + ":" + url, ipBanData = this.ipBlockList.get(address);
            if (ipBanData && ipBanData.banExpiry > now) {
                this.logAccess("ban", method, address, url, new Date(ipBanData.banExpiry));
                return true;
            }
            ;
            const rateLimitData = this.RateLimitBucket.get(key) || { count: 0, lastSeen: now };
            rateLimitData.count++;
            rateLimitData.lastSeen = now;
            this.RateLimitBucket.set(key, rateLimitData);
            if (rateLimitData.count > this.RATE_LIMIT) {
                return await this.setIPBlock(method, address, url, {
                    banExpiry: now + this.BAN_LENGTH,
                    reason: `Exceeded ${this.RATE_LIMIT} requests to ${url}`,
                });
            }
            ;
            return false;
        }
        catch (e) {
            logger('@SYSTEM').error(e instanceof Error ? e.message : e);
            return false;
        }
        ;
    }
    ;
    broom = async () => {
        const now = Date.now();
        if (process.env.DEBUG === "true")
            logger('@MAINTENANCE').info("Performing RateLimit Bucket Maintenance..");
        for (const [key, data] of this.RateLimitBucket) {
            if (now - data.lastSeen > this.INACTIVITY_LENGTH) {
                this.RateLimitBucket.delete(key);
            }
        }
        ;
        for (const [ip, banData] of this.ipBlockList) {
            if (banData.banExpiry <= now) {
                this.ipBlockList.delete(ip);
            }
        }
        ;
        if (this.RateLimitBucket.size > 10000) {
            let oldestKey, oldestTime = Infinity;
            for (const [key, data] of this.RateLimitBucket) {
                if (data.lastSeen < oldestTime) {
                    oldestKey = key;
                    oldestTime = data.lastSeen;
                }
                ;
            }
            ;
            if (oldestKey)
                this.RateLimitBucket.delete(oldestKey);
        }
    };
    async cleanup() {
        try {
            if (process.env.DEBUG === "true")
                logger('@MAINTENANCE').info("Cleaning up timers and data...");
            if (this.SWEEP_TIMER) {
                clearInterval(this.SWEEP_TIMER);
                this.SWEEP_TIMER = undefined;
            }
            ;
            this.RateLimitBucket.clear();
            this.ipBlockList.clear();
            return true;
        }
        catch (e) {
            logger('@SYSTEM').error(e instanceof Error ? e.message : e);
            return false;
        }
        ;
    }
    ;
    /**
     *
     * for middleware use
     */
    mwRateLimit() {
        return async (req, res, go) => {
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress, url = req.url;
            if (await this.isRateLimited(req.method, ip, url)) {
                return WriteAndEnd(res, 429, 'Too many requests');
            }
            ;
            return await go();
        };
    }
    ;
    /**
     *
     * for middleware use
     */
    mwBlockList() {
        return async (req, res, go) => {
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress, url = req.url;
            if (await this.isBlocked(req.method, ip, url)) {
                return WriteAndEnd(res, 403, 'Access Denied');
            }
            ;
            return await go();
        };
    }
    ;
}
;
export default Safety;
export async function WriteAndEnd(res, statusCode, message) {
    return res
        .writeHead(statusCode, {
        'Content-Length': Buffer.byteLength(message),
        'Content-Type': 'text/plain'
    })
        .end(message);
}
;
//# sourceMappingURL=safety.js.map