import { IncomingMessage, ServerResponse } from 'http';
type Response = ServerResponse<IncomingMessage>;
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
    isAllowed(req: IncomingMessage, res: Response): Promise<true | Response>;
    /**
     * @deprecated
     */
    maintenance(): Promise<void>;
    private broom;
    cleanup(): Promise<boolean>;
}
export default Safety;
export declare function WriteAndEnd(res: Response, statusCode: number, message: string): Promise<Response>;
//# sourceMappingURL=safety.d.ts.map