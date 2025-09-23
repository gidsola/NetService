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
const service = new MicroService('yourdomain.com');

// Server is ready when 'ready' event fires
service.on('ready', () => {
  console.log('Server is running');
});
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
Place certificates in /main/ssl/ directory.  

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

Notes

Handles both HTTP and HTTPS automatically  
Designed for Next.js custom server implementations  
