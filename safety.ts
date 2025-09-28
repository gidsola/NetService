import { IncomingMessage, ServerResponse } from 'http';
import logger from './logger.js';
import chalk from 'chalk';

type BanData = { banExpiry: number; reason: string; };

type LimitData = { count: number; lastSeen: number; };

type Response = ServerResponse<IncomingMessage>;

class Safety {
  urlBlockList: {
    url: string;
  }[];
  ipBlockList: Map<any, any>;
  RateLimitBucket: {
    [x: string]: {
      count: number,
      lastSeen: number
    }
  };

  RATE_LIMIT: number;
  INACTIVITY_LENGTH: number;
  BAN_LENGTH: number;
  SWEEP_INTERVAL: number;
  /**
   * @type {NodeJS.Timeout | undefined}
   */
  sweeper: NodeJS.Timeout | undefined;

  constructor() {

    this.urlBlockList = [{ url: "/admin" }];
    this.ipBlockList = new Map();
    /**@type {{[x: string]: {count: number, lastSeen: number}}} */
    this.RateLimitBucket = {};

    this.RATE_LIMIT = 10;
    this.INACTIVITY_LENGTH = 10000;
    this.BAN_LENGTH = 300000;
    this.SWEEP_INTERVAL = 60000;

    /**
     * @type {NodeJS.Timeout | undefined}
     */
    // this.sweeper;
  }


  logAccess(type: string, method: string, address: string, url: string, a: any | null = null) {
    const

      owner: null | string = "@SAFETY",
      msgString = () => `${chalk.bgBlueBright(address)}: (Method: ${method}, URL: ${chalk.bgBlue(url)}`,

      blockType: { [x: string]: (a: any | null) => {}; } = {
        "url": () => logger(owner).warn(`[${chalk.bgRedBright("[BLOCKED URL]")}] => ${msgString()}\n`),

        "ip": () => logger(owner).warn(`[${chalk.bgRedBright("[BLOCKED IP]")}] => ${msgString()}\n`),

        "ban": (a) => logger(owner).warn(`[${chalk.bgRedBright("BANNED")}] => ${chalk.bgBlueBright(address)} until ${a}\n`)
      };
    blockType[type] ? blockType[type](a) : logger("SYSTEM").warn("Unknown Access Log Type..");
  };


  async isBlocked(method: string, address: string, url: string) {
    try {
      if (address.includes("::1")) return false;
      const now = Date.now();

      if (this.urlBlockList.some((x) => url === x.url)) {
        this.logAccess("url", method, address, url);
        return true;
      };

      /**
       * @type {BanData}
       */
      const ipBanData: BanData = this.ipBlockList.get(address);
      if (ipBanData?.banExpiry > now) {
        this.logAccess("ip", method, address, url);
        return true;
      };

      return false;
    }
    catch (e) {
      return true; // just incase the fail is due to the user.
    };
  };



  async setIPBlock(method: string, address: string, url: string, banData: BanData) {
    try {
      this.ipBlockList.set(address, { ...banData });
      this.logAccess("ip", method, address, url);
      return true;
    }
    catch (/**@type {any}*/e: any) {
      e instanceof Error
        ? logger().error("Error setting IP block" + e.message)
        : logger().error("Error setting IP block" + e)
      return false;
    };
  };



  async isRateLimited(method: string, address: string, url: string) {
    if (address.includes("::1")) return false;
    const
      now = Date.now(),
      key = address + ":" + url,
    /**@type {BanData}*/ipBanData: BanData = this.ipBlockList.get(address);

    if (ipBanData?.banExpiry > now) {
      this.logAccess("ban", method, address, url, new Date(ipBanData.banExpiry));
      return true;
    };


    const rateLimitData: LimitData = this.RateLimitBucket[key] || { count: 0, lastSeen: now };

    rateLimitData.count++;
    rateLimitData.lastSeen = now;
    this.RateLimitBucket[key] = rateLimitData;

    if (rateLimitData.count > this.RATE_LIMIT) {
      return await this.setIPBlock(method, address, url, {
        banExpiry: now + this.BAN_LENGTH,
        reason: `Exceeded ${this.RATE_LIMIT} requests to ${url}`,
      });
    };

    return false;
  };


  /**
   * @param {Response} res
   * @param {number} statusCode
   * @param {string} message
   *
   */
  async WriteAndEnd(res: Response, statusCode: number, message: string) {
    return res
      .writeHead(statusCode, {
        'Content-Length': Buffer.byteLength(message),
        'Content-Type': 'text/plain'
      })
      .end(message);
  };


  /**
   * @param {IncomingMessage} req
   * @param {Response} res
   *
   */
  async isAllowed(req: IncomingMessage, res: Response) {
    try {
      if (!req.method || !req.url || req.method === "POST") return res.end(); // dont forget posts are blocked..

      if ((await this.isRateLimited(req.method, req.headers['x-forwarded-for'] as string || req.socket.remoteAddress as string, req.url))) {
        return this.WriteAndEnd(res, 429, 'Too many requests');
      };

      if ((await this.isBlocked(req.method, req.socket.remoteAddress as string, req.url))) {
        return this.WriteAndEnd(res, 403, `Access Denied`);
      };

      return true;

    } catch (e) {
      logger().error(e instanceof Error ? e.message : e);
      return this.WriteAndEnd(res, 500, 'Internal Server Error');
    };
  };


  maintenance() {
    logger('@MAINTENANCE').info("Initializing maintenance...");
    this.sweeper = setInterval(() => {
      const now = Date.now();
      if (process.env.DEBUG === "true")
        logger('@MAINTENANCE').info("Performing RateLimit Bucket Maintenance..");

      for (const [key, data] of Object.entries(this.RateLimitBucket)) {
        if (now - data.lastSeen > this.INACTIVITY_LENGTH) {
          delete this.RateLimitBucket[key];
        }
      };

      for (const [ip, banData] of this.ipBlockList.entries()) {
        if (banData.banExpiry <= now) {
          this.ipBlockList.delete(ip);
        }
      };

      if (Object.keys(this.RateLimitBucket).length > 10000) {
        const oldestKey = Object.keys(this.RateLimitBucket)[0];
        if (oldestKey)
          delete this.RateLimitBucket[oldestKey];
      };

    }, this.SWEEP_INTERVAL);
  };


  async cleanup() {
    return new Promise((resolve, reject) => {
      try {
        logger('@MAINTENANCE').info("Cleaning up timers and data...");
        clearInterval(this.sweeper);
        this.RateLimitBucket = {};
        this.ipBlockList.clear();
        resolve(true);
      } catch (e) {
        reject(e instanceof Error ? e.message : e);
      };
    });
  };

};
export default Safety;
