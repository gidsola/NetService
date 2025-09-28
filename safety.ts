import { IncomingMessage, ServerResponse } from 'http';
import logger from './logger.js';
import chalk from 'chalk';

type BanData = { banExpiry: number; reason: string; };

type LimitData = { count: number; lastSeen: number; };

type Response = ServerResponse<IncomingMessage>;

class Safety {
  private urlBlockList: {
    url: string;
  }[];
  private ipBlockList: Map<any, any>;
  private RateLimitBucket: {
    [x: string]: {
      count: number,
      lastSeen: number
    }
  };

  private RATE_LIMIT: number;
  private INACTIVITY_LENGTH: number;
  private BAN_LENGTH: number;
  private SWEEP_INTERVAL: number;
  private SWEEP_TIMER: NodeJS.Timeout | undefined;

  constructor() {

    this.urlBlockList = [{ url: "/admin" }];
    this.ipBlockList = new Map();
    this.RateLimitBucket = {};

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


  private logAccess(type: string, method: string, address: string, url: string, a: any | null = null) {
    const
      msgString = () => `${chalk.bgBlueBright(address)}: (Method: ${method}, URL: ${chalk.bgBlue(url)}`,
      blockType: {
        [x: string]: (a: any | null) => {};
      } =
      {
        "url": () => logger("@SAFETY").warn(`[${chalk.bgRedBright("[BLOCKED URL]")}] => ${msgString()}\n`),
        "ip": () => logger("@SAFETY").warn(`[${chalk.bgRedBright("[BLOCKED IP]")}] => ${msgString()}\n`),
        "ban": (a) => logger("@SAFETY").warn(`[${chalk.bgRedBright("BANNED")}] => ${chalk.bgBlueBright(address)} until ${a}\n`)
      };
    blockType[type] ? blockType[type](a) : logger("@SYSTEM").warn("Unknown Access Log Type..");
  };


  private async isBlocked(method: string, address: string, url: string) {
    try {
      if (address.includes("::1")) return false;
      const now = Date.now();

      if (this.urlBlockList.some((x) => url === x.url)) {
        this.logAccess("url", method, address, url);
        return true;
      };

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



  private async setIPBlock(method: string, address: string, url: string, banData: BanData) {
    try {
      this.ipBlockList.set(address, { ...banData });
      this.logAccess("ip", method, address, url);
      return true;
    }
    catch (e: any) {
      logger('@SAFETY').error(e instanceof Error ? e.message : e);
      return false;
    };
  };



  private async isRateLimited(method: string, address: string, url: string) {
    try {
      if (address.includes("::1")) return false;
      const
        now = Date.now(),
        key = address + ":" + url,
        ipBanData: BanData = this.ipBlockList.get(address);

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
    }
    catch (e) {
      logger('@SYSTEM').error(e instanceof Error ? e.message : e);
      return false;
    };
  };


  async isAllowed(req: IncomingMessage, res: Response) {
    try {
      if (!req.method || !req.url || req.method === "POST") return res.end(); // dont forget posts are blocked..

      if ((await this.isRateLimited(req.method, req.headers['x-forwarded-for'] as string || req.socket.remoteAddress as string, req.url))) {
        return WriteAndEnd(res, 429, 'Too many requests');
      };

      if ((await this.isBlocked(req.method, req.socket.remoteAddress as string, req.url))) {
        return WriteAndEnd(res, 403, `Access Denied`);
      };

      return true;

    } catch (e) {
      logger('@SAFETY').error(e instanceof Error ? e.message : e);
      return WriteAndEnd(res, 500, 'Internal Server Error');
    };
  };


  /**
   * @deprecated
   */
  async maintenance() {
    try {
      logger('@MAINTENANCE').info("Initializing maintenance...");

      // this.SWEEP_TIMER = setInterval(() => {
      //   const now = Date.now();

      //   if (process.env.DEBUG === "true")
      //     logger('@MAINTENANCE').info("Performing RateLimit Bucket Maintenance..");

      //   for (const [key, data] of Object.entries(this.RateLimitBucket)) {
      //     if (now - data.lastSeen > this.INACTIVITY_LENGTH) {
      //       delete this.RateLimitBucket[key];
      //     }
      //   };

      //   for (const [ip, banData] of this.ipBlockList.entries()) {
      //     if (banData.banExpiry <= now) {
      //       this.ipBlockList.delete(ip);
      //     }
      //   };

      //   if (Object.keys(this.RateLimitBucket).length > 10000) {
      //     const oldestKey = Object.keys(this.RateLimitBucket)[0];
      //     if (oldestKey)
      //       delete this.RateLimitBucket[oldestKey];
      //   };

      // }, this.SWEEP_INTERVAL);
    }
    catch (e) {
      logger('@SYSTEM').error(e instanceof Error ? e.message : e);
    };
  };


  private broom = async () => {
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
  };


  async cleanup() {
    try {
      if (process.env.DEBUG === "true")
        logger('@MAINTENANCE').info("Cleaning up timers and data...");

      if (this.SWEEP_TIMER) {
        clearInterval(this.SWEEP_TIMER);
        this.SWEEP_TIMER = undefined;
      };

      this.RateLimitBucket = {};
      this.ipBlockList.clear();

      return true;
    }
    catch (e) {
      logger('@SYSTEM').error(e instanceof Error ? e.message : e);
      return false;
    };
  };

};
export default Safety;


export async function WriteAndEnd(res: Response, statusCode: number, message: string) {
  return res
    .writeHead(statusCode, {
      'Content-Length': Buffer.byteLength(message),
      'Content-Type': 'text/plain'
    })
    .end(message);
};
