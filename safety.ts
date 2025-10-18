import { IncomingMessage, ServerResponse } from 'http';
import { WriteAndEnd } from './utils/helpers.js';
import logger from './utils/logger.js';
import chalk from 'chalk';

/**
 * Represents ban data for an IP address.
 */
type BanData = { banExpiry: number; reason: string; };
/**
 * Represents rate limit tracking data for a specific IP+URL combination.
 */
type LimitData = { count: number; lastSeen: number; };


/**
 * A security utility class for rate limiting, IP blocking, and URL blocking.
 * Automatically sweeps expired bans and inactive rate-limit entries at fixed intervals.
 */
class Safety {

  private URL_BLOCKLIST: { url: string; }[];
  private IP_BLOCKLIST: Map<string, BanData> = new Map();
  private RATE_LIMIT_BUCKET: Map<string, LimitData> = new Map();
  private RATE_LIMIT: number;
  private INACTIVITY_LENGTH: number;
  private BAN_LENGTH: number;
  private SWEEP_INTERVAL: number;
  private SWEEP_TIMER: NodeJS.Timeout | undefined;


  /**
   * Creates a new Safety instance with default configurations.
   * Initializes a maintenance timer to clean up expired bans and stale rate-limit data.
   */
  constructor() {

    /* These values can be overidden(not yet) by passing an options object to the middlewares. (NYI)*/

    this.URL_BLOCKLIST = process.env.URL_BLOCKLIST
      ? process.env.URL_BLOCKLIST.split(',').map((url) => { return { url } })
      : [];

    this.RATE_LIMIT = process.env.RATE_LIMIT
      ? parseInt(process.env.RATE_LIMIT)
      : 10;

    this.INACTIVITY_LENGTH = process.env.INACTIVITY_LENGTH
      ? parseInt(process.env.INACTIVITY_LENGTH)
      : 10000;

    this.BAN_LENGTH = process.env.BAN_LENGTH
      ? parseInt(process.env.BAN_LENGTH)
      : 300000;

    this.SWEEP_INTERVAL = process.env.SWEEP_INTERVAL
      ? parseInt(process.env.SWEEP_INTERVAL)
      : 60000;

    this.SWEEP_TIMER = setInterval(async () => {
      try {
        if (process.env.DEBUG === "true") logger('@MAINTENANCE').info("Grabbin a broom...");
        await this.broom();
      }
      catch (e) { logger('@SAFETY').error('Broom failed:' + e); };
    }, this.SWEEP_INTERVAL);

  }


  /**
   * Logs access attempts with visual formatting for blocked requests.
   */
  private logAccess(type: string, method: string, address: string, url: string, a: any | null = null) {
    const
      msgString = () => `${chalk.bgBlueBright(address)}: (Method: ${method}, URL: ${chalk.bgBlue(url)}`,
      blockType: { [x: string]: (a: any | null) => {}; } = {
        "url": () => logger("@SAFETY").warn(`[${chalk.bgRedBright("[BLOCKED URL]")}] => ${msgString()}\n`),
        "ip": () => logger("@SAFETY").warn(`[${chalk.bgRedBright("[BLOCKED IP]")}] => ${msgString()}\n`),
        "ban": (a) => logger("@SAFETY").warn(`[${chalk.bgRedBright("BANNED")}] => ${chalk.bgBlueBright(address)} until ${a}\n`)
      };
    blockType[type] ? blockType[type](a) : logger("@SYSTEM").warn("Unknown Access Log Type..");
  };


  /**
   * Checks if a request is blocked due to URL or active IP ban.
   */
  private async isBlocked(method: string, address: string, url: string) {
    try {
      const now = Date.now();

      if (this.URL_BLOCKLIST.some((x) => url === x.url)) {
        this.logAccess("url", method, address, url);
        return true;
      };

      const ipBanData = this.IP_BLOCKLIST.get(address);
      if (ipBanData && ipBanData.banExpiry > now) {
        this.logAccess("ip", method, address, url);
        return true;
      };

      return false;
    }
    catch (e) {
      return true; // think about this
    };
  };


  /**
   * Bans an IP address and logs the action.
   */
  private async setIPBlock(method: string, address: string, url: string, banData: BanData) {
    try {
      this.IP_BLOCKLIST.set(address, { ...banData });
      this.logAccess("ip", method, address, url);
      return true;
    }
    catch (e: any) {
      logger('@SAFETY').error(e instanceof Error ? e.message : e);
      return false;
    };
  };


  /**
   * Checks if a request exceeds rate limits and bans the IP if necessary.
   */
  private async isRateLimited(method: string, address: string, url: string) {
    try {
      const
        now = Date.now(),
        key = address + ":" + url,
        ipBanData = this.IP_BLOCKLIST.get(address);

      if (ipBanData && ipBanData.banExpiry > now) {
        this.logAccess("ban", method, address, url, new Date(ipBanData.banExpiry));
        return true;
      };

      const rateLimitData = this.RATE_LIMIT_BUCKET.get(key) || { count: 0, lastSeen: now };

      rateLimitData.count++;
      rateLimitData.lastSeen = now;
      this.RATE_LIMIT_BUCKET.set(key, rateLimitData);

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


  /**
   * Cleans up expired bans and stale rate-limit entries.
   */
  private broom = async () => {
    const now = Date.now();

    if (process.env.DEBUG === "true")
      logger('@MAINTENANCE').info("Performing RateLimit Bucket Maintenance..");

    for (const [key, data] of this.RATE_LIMIT_BUCKET) {
      if (now - data.lastSeen > this.INACTIVITY_LENGTH) {
        this.RATE_LIMIT_BUCKET.delete(key);
      }
    };

    for (const [ip, banData] of this.IP_BLOCKLIST) {
      if (banData.banExpiry <= now) {
        this.IP_BLOCKLIST.delete(ip);
      }
    };

    if (this.RATE_LIMIT_BUCKET.size > 10000) {
      let
        oldestKey: string = '',
        oldestTime = Infinity;

      for (const [key, data] of this.RATE_LIMIT_BUCKET) {
        if (data.lastSeen < oldestTime) {
          oldestKey = key;
          oldestTime = data.lastSeen;
        };
      };

      if (oldestKey) this.RATE_LIMIT_BUCKET.delete(oldestKey);
    }
  };


  /**
   * Cleans up timers and resets all block/rate-limit data.
   */
  async cleanup() {
    try {
      if (process.env.DEBUG === "true")
        logger('@MAINTENANCE').info("Cleaning up timers and data...");

      if (this.SWEEP_TIMER) {
        clearInterval(this.SWEEP_TIMER);
        this.SWEEP_TIMER = undefined;
      };

      this.RATE_LIMIT_BUCKET.clear();
      this.IP_BLOCKLIST.clear();

      return true;
    }
    catch (e) {
      logger('@SYSTEM').error(e instanceof Error ? e.message : e);
      return false;
    };
  };


  /**
   * 
   * for middleware use
   */
  public mwRateLimit() {
    return async (req: IncomingMessage, res: ServerResponse<IncomingMessage>) => {
      const
        ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress as string,
        url = req.url!;

      if (await this.isRateLimited(req.method!, ip, url)) {
        return WriteAndEnd(res, 429, 'Too many requests');
      };
      return;
    };
  };


  /**
   * 
   * for middleware use
   */
  public mwBlockList() {
    return async (req: IncomingMessage, res: ServerResponse<IncomingMessage>) => {
      const
        ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress as string,
        url = req.url!;

      if (await this.isBlocked(req.method!, ip, url)) {
        return WriteAndEnd(res, 403, 'Access Denied');
      };
      return;
    };
  };

};
export default Safety;
