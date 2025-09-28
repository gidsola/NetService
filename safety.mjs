import { IncomingMessage, ServerResponse } from 'http';
import logger from './logger.mjs';
import chalk from 'chalk';

/**
 * @typedef {{banExpiry: number, reason: string}} BanData
 * 
 * @typedef {{count: number, lastSeen: number}} LimitData
 * 
 * @typedef {ServerResponse<IncomingMessage>} Response
 * 
 */

class Safety {

  constructor() {

    this.urlBlockList = [{ url: "/admin" }];
    this.ipBlockList = new Map();
    this.RateLimitBucket = {};

    this.RATE_LIMIT = 10;
    this.INACTIVITY_LENGTH = 10000;
    this.BAN_LENGTH = 300000;
    this.SWEEP_INTERVAL = 60000;

    /**
     * @type {NodeJS.Timeout | undefined}
     */
    this.sweeper;
  }

  logAccess(type, method, address, url, a = null) {
    const
      owner = "@SAFETY",
      msgString = () => `${chalk.bgBlueBright(address)}: (Method: ${method}, URL: ${chalk.bgBlue(url)}`,
      blockType = {
        "url": () => logger(owner).warn(`[${chalk.bgRedBright("[BLOCKED URL]")}] => ${msgString()}\n`),

        "ip": () => logger(owner).warn(`[${chalk.bgRedBright("[BLOCKED IP]")}] => ${msgString()}\n`),

        "ban": (a) => logger(owner).warn(`[${chalk.bgRedBright("BANNED")}] => ${chalk.bgBlueBright(address)} until ${a}\n`)
      };
    blockType[type] ? blockType[type](a) : logger("SYSTEM").warn("Unknown Access Log Type..");
  };

  /**
   * 
   * @param {string} method 
   * @param {string} address 
   * @param {string} url 
   * @returns 
   */
  async isBlocked(method, address, url) {
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
      const ipBanData = this.ipBlockList.get(address);
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


  /**
   * @param {string} method
   * @param {string} address
   * @param {string} url
   * @param {BanData} banData
   */
  async setIPBlock(method, address, url, banData) {
    try {
      this.ipBlockList.set(address, { ...banData });
      this.logAccess("ip", method, address, url);
      return true;
    }
    catch (/**@type {any}*/e) {
      e instanceof Error
        ? logger().error("Error setting IP block" + e.message)
        : logger().error("Error setting IP block" + e)
      return false;
    };
  };


  /**
   * 
   * @param {string} method 
   * @param {string} address 
   * @param {string} url 
   * @returns 
   */
  async isRateLimited(method, address, url) {
    if (address.includes("::1")) return false;
    const
      now = Date.now(),
      key = address + ":" + url,
    /**@type {BanData}*/ipBanData = this.ipBlockList.get(address);

    if (ipBanData?.banExpiry > now) {
      this.logAccess("ban", method, address, url, new Date(ipBanData.banExpiry));
      return true;
    };

    /**
     * @type {LimitData}
     */
    const rateLimitData = this.RateLimitBucket[key] || { count: 0, lastSeen: now };

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
  async WriteAndEnd(res, statusCode, message) {
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
  async isAllowed(req, res) {
    try {
      if (!req.method || !req.url || req.method === "POST") return res.end(); // dont forget posts are blocked..

      if ((await this.isRateLimited(req.method, req.headers['x-forwarded-for'] /*as string*/ || req.socket.remoteAddress, req.url))) {
        return this.WriteAndEnd(res, 429, 'Too many requests');
      };

      if ((await this.isBlocked(req.method, req.socket.remoteAddress, req.url))) {
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

      if (this.RateLimitBucket.size > 10000) {
        const oldestKey = [...this.RateLimitBucket.keys()][0];
        this.RateLimitBucket.delete(oldestKey);
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
