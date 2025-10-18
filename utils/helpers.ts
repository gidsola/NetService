import { IncomingMessage, ServerResponse } from 'http';


/**
 * Helper function to write a response and end the connection.
 */
export async function WriteAndEnd(res: ServerResponse<IncomingMessage>, statusCode: number, message: string) {
  return res
    .writeHead(statusCode, {
      'Content-Length': Buffer.byteLength(message),
      'Content-Type': 'text/plain'
    })
    .end(message);
};


export function SetHeaders(res: ServerResponse<IncomingMessage>) {
  // gotta be a better way..
  // def need to re-visit these, locale to start. permissions etc, need to be adjustable per user.
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' https://cdn.jsdelivr.net https://fonts.gstatic.com; img-src 'self' https://avatars.githubusercontent.com/ https://authjs.dev https://raw.githubusercontent.com https://github.com https://cdn.discordapp.com data: https://www.google-analytics.com https://www.googleadservices.com; frame-src 'self' https://www.google.com https://www.googleadservices.com https://www.google-analytics.com https://www.googleadservices.com; base-uri 'none'; form-action 'self'; frame-ancestors 'none';");
  res.setHeader('Permissions-Policy', "geolocation=(), midi=(), sync-xhr=(), microphone=(), camera=(), magnetometer=(), gyroscope=(), fullscreen=(self), payment=()");
  res.setHeader('Feature-Policy', "geolocation 'none'; midi 'none'; sync-xhr 'none'; microphone 'none'; camera 'none'; magnetometer 'none'; gyroscope 'none'; fullscreen 'self'; payment 'none';");
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Content-Language', 'en-US');
  res.setHeader('Connection', 'close');
};
