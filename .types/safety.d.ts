import { IncomingMessage, ServerResponse } from 'http';
type BanData = {
    banExpiry: number;
    reason: string;
};
type Response = ServerResponse<IncomingMessage>;
declare class Safety {
    urlBlockList: {
        url: string;
    }[];
    ipBlockList: Map<any, any>;
    RateLimitBucket: {
        [x: string]: {
            count: number;
            lastSeen: number;
        };
    };
    RATE_LIMIT: number;
    INACTIVITY_LENGTH: number;
    BAN_LENGTH: number;
    SWEEP_INTERVAL: number;
    /**
     * @type {NodeJS.Timeout | undefined}
     */
    sweeper: NodeJS.Timeout | undefined;
    constructor();
    logAccess(type: string, method: string, address: string, url: string, a?: any | null): void;
    isBlocked(method: string, address: string, url: string): Promise<boolean>;
    setIPBlock(method: string, address: string, url: string, banData: BanData): Promise<boolean>;
    isRateLimited(method: string, address: string, url: string): Promise<boolean>;
    /**
     * @param {Response} res
     * @param {number} statusCode
     * @param {string} message
     *
     */
    WriteAndEnd(res: Response, statusCode: number, message: string): Promise<Response>;
    /**
     * @param {IncomingMessage} req
     * @param {Response} res
     *
     */
    isAllowed(req: IncomingMessage, res: Response): Promise<true | Response>;
    maintenance(): void;
    cleanup(): Promise<unknown>;
}
export default Safety;
//# sourceMappingURL=safety.d.ts.map