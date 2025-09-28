# MicroService

A custom HTTP/HTTPS server for Next.js applications with enhanced security and flexibility.

## Features
- Automatic TLS 1.2/1.3 configuration
- Security headers (CSP, HSTS, XSS protection)
- Event-driven architecture
- Development/production environment detection
- Next.js integration

## Basic Usage

```javascript
import MicroService from './MicroService.mjs';

// Create server (automatically uses HTTPS in production)
const Service = new MicroService('yourdomain.com');

// Server is ready when 'ready' event fires
Service.on('ready', () => {
  console.log('Server is running');
});
```
### Cleanup
There is also a cleanup function you can pass to your maintenance scripts.
```JavaScript
await Service.Safety.cleanup();
```

## Configuration  
The server automatically:  

Uses HTTP on localhost (port 80)
Uses HTTPS in production (port 443)  

Requires SSL certificates in production:
```
private.key
certificate.crt
ca_bundle.crt (optional)
```
Make sure paths to certificates are correctly identified in your .env (full path).  

### Environment
```bash
# .env
DEV="localhost" # When DEV and DOMAIN are the same it runs in development mode.
DOMAIN="localhost" # Change to your domain name to run in production.
DIR_SSL="/path/to/your/ssl/" # This must be the full path to your certs.
TLS_CIPHERS="TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA"
TLS_MINVERSION="TLSv1.2"
TLS_MAXVERSION="TLSv1.3"
```

## Security Headers  
Automatically sets secure headers including:  

Content-Security-Policy  
Strict-Transport-Security  
X-Frame-Options  
X-Content-Type-Options  
X-XSS-Protection  

## Environment Setup  
For local development:  
### Generate self-signed certificates  
```bash
openssl req -x509 -out localhost.crt -keyout localhost.key \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' -extensions EXT -config <( \
   printf "[dn]\nCN=localhost\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS\:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
```

## Notes

Handles both HTTP and HTTPS automatically  
Designed for Next.js custom server implementations  
