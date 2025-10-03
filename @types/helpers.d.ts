import { IncomingMessage, ServerResponse } from 'http';
/**
 * Helper function to write a response and end the connection.
 */
export declare function WriteAndEnd(res: ServerResponse<IncomingMessage>, statusCode: number, message: string): Promise<ServerResponse<IncomingMessage>>;
export declare function SetHeaders(res: ServerResponse<IncomingMessage>): void;
//# sourceMappingURL=helpers.d.ts.map