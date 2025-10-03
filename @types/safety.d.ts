import { IncomingMessage, ServerResponse } from 'http';
/**
 * A security utility class for rate limiting, IP blocking, and URL blocking.
 * Automatically sweeps expired bans and inactive rate-limit entries at fixed intervals.
 */
declare class Safety {
    private URL_BLOCKLIST;
    private IP_BLOCKLIST;
    private RATE_LIMIT_BUCKET;
    private RATE_LIMIT;
    private INACTIVITY_LENGTH;
    private BAN_LENGTH;
    private SWEEP_INTERVAL;
    private SWEEP_TIMER;
    /**
     * Creates a new Safety instance with default configurations.
     * Initializes a maintenance timer to clean up expired bans and stale rate-limit data.
     */
    constructor();
    /**
     * Logs access attempts with visual formatting for blocked requests.
     */
    private logAccess;
    /**
     * Checks if a request is blocked due to URL or active IP ban.
     */
    private isBlocked;
    /**
     * Bans an IP address and logs the action.
     */
    private setIPBlock;
    /**
     * Checks if a request exceeds rate limits and bans the IP if necessary.
     */
    private isRateLimited;
    /**
     * Cleans up expired bans and stale rate-limit entries.
     */
    private broom;
    /**
     * Cleans up timers and resets all block/rate-limit data.
     */
    cleanup(): Promise<boolean>;
    /**
     *
     * for middleware use
     */
    mwRateLimit(): (req: IncomingMessage, res: ServerResponse<IncomingMessage>) => Promise<ServerResponse<IncomingMessage> | undefined>;
    /**
     *
     * for middleware use
     */
    mwBlockList(): (req: IncomingMessage, res: ServerResponse<IncomingMessage>) => Promise<ServerResponse<IncomingMessage> | undefined>;
}
export default Safety;
//# sourceMappingURL=safety.d.ts.map