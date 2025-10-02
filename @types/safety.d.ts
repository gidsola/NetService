import { IncomingMessage, ServerResponse } from 'http';
declare class Safety {
    private urlBlockList;
    private ipBlockList;
    private RateLimitBucket;
    private RATE_LIMIT;
    private INACTIVITY_LENGTH;
    private BAN_LENGTH;
    private SWEEP_INTERVAL;
    private SWEEP_TIMER;
    constructor();
    private logAccess;
    private isBlocked;
    private setIPBlock;
    private isRateLimited;
    private broom;
    cleanup(): Promise<boolean>;
    /**
     *
     * for middleware use
     */
    mwRateLimit(): (req: IncomingMessage, res: ServerResponse<IncomingMessage>, go: () => Promise<void>) => Promise<void | ServerResponse<IncomingMessage>>;
    /**
     *
     * for middleware use
     */
    mwBlockList(): (req: IncomingMessage, res: ServerResponse<IncomingMessage>, go: () => Promise<void>) => Promise<void | ServerResponse<IncomingMessage>>;
}
export default Safety;
export declare function WriteAndEnd(res: ServerResponse<IncomingMessage>, statusCode: number, message: string): Promise<ServerResponse<IncomingMessage>>;
//# sourceMappingURL=safety.d.ts.map