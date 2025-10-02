# NetService

**A secure, production-ready custom server for Next.js with built-in TLS, security headers, and middleware support.**

NetService abstracts HTTPS configuration, security best practices, and environment detection, letting you focus on your app.

---

## ✨ Features

- **Automatic TLS 1.2/1.3** – HTTPS in production, HTTP for `localhost`
- **Security Headers** – Preconfigured CSP, HSTS, XSS protection, and more
- **Middleware Pipeline** – Modular request processing (rate limiting, blocking, etc.)
- **Event-Driven** – Hook into `ready`, `error`, and other lifecycle events
- **Next.js Integration** – Drop-in replacement for `next start` with `customServer` support
- **Dev/Prod Parity** – Consistent behavior across environments

---

## 🚀 Quick Start

### Install
```bash
npm install netservice
```

## Basic Usage
```JavaScript
import NetService from 'netservice';

const service = new NetService('yourdomain.com'); // use localhost` for development.
service.on('ready', () => {
  console.log(`Server running on ${service.development ? 'http://localhost' : 'https://yourdomain.com'}`);
});
```

## 🔧 Configuration  

### Environment Variables (.env)  

```bash
DOMAIN="yourdomain.com"      # Production domain (use 'localhost' for dev)  
DIR_SSL="/path/to/certs/"    # Path to SSL certificates  
TLS_CIPHERS="..."            # OpenSSL cipher string (optional)  
TLS_MINVERSION="TLSv1.2"     # Minimum TLS version (optional)  
TLS_MAXVERSION="TLSv1.3"     # Maximum TLS version (optional)  
```

### SSL Certificates   
Place these files in DIR_SSL:  
```
- Production:
 `private.key`, `certificate.crt`, `ca_bundle.crt` 

- (optional)Development:
 `localhost.key`, `localhost.crt`
```
### Generate Self-Signed Certs (Dev)  

```bash
openssl req -x509 -out localhost.crt -keyout localhost.key \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' -extensions EXT -config <( \
   printf "[dn]\nCN=localhost\n[req]\ndistinguished_name=dn\n[EXT]\nsubjectAltName=DNS\:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
```

## 🔗 Middleware
### NetService includes a built-in middleware manager for request processing. Middleware runs sequentially and can terminate early.  

### Built-in Middleware

- Auto-Applied Security Headers   
- mwRateLimit() Rate-limiting by IP/URL/  
- mwBlockList() Block requests to specific URLs/  

### Custom Middleware

#### ⚠️ NOTE:
#### ⚠️ The use of go(middleware next) is being removed in an upcoming version. Its inclusion currently is for compatibility only  and actually does nothing.** 

```JavaScript
import NetService from 'netservice';

const service = new NetService('yourdomain.com');

// Add middleware to a specific path
service.middlewareMgr.register('/api', async (req, res, go) => {
  if (!req.headers.authorization) {
    res.writeHead(401).end('Unauthorized');
    return; // Terminate early
  }
  await go(); // Proceed to next middleware
});

// Override default middleware
service.middlewareMgr.register('/static', async (req, res, go) => {
  await go(); // Bypass rate limiting for static assets
});
```

### Middleware Signature  

```TypeScript
type Middleware = (
  req: IncomingMessage,
  res: ServerResponse,
  go: () => Promise<void>  // deprecated
) => Promise<void | ServerResponse>;

```

## 🛡 Security  

### NetService enforces modern security best practices out of the box:  

### Built-in Protections
- **TLS Enforcement**: Automatic HTTPS with TLS 1.2/1.3 in production (HTTP for localhost)
- **Security Headers**: Comprehensive protection against common web vulnerabilities
- **Rate Limiting**: 10 requests per 10-second window by default (configurable)
- **Blocklist**: Pre-configured protection for sensitive paths (`/admin`)

### Default Headers
- All responses include these security headers automatically:
- Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
- Content-Security-Policy: Restricts script, style, and media sources
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Permissions-Policy: Disables sensitive APIs (camera, geolocation, etc.)


#### Customization
Extend security behavior by subclassing the `Safety` class:

```javascript
class CustomSafety extends Safety {
  constructor() {
    super();
    this.RATE_LIMIT = 20; // Adjust rate limiting
    this.urlBlockList = [{ url: "/admin" }, { url: "/private" }];
  }

  async isAllowed(req, res) {
    // Add <followup encodedFollowup="%7B%22snippet%22%3A%22custom%20logic%20before%20default%20checks%22%2C%22question%22%3A%22What%20types%20of%20custom%20logic%20are%20typically%20added%20before%20the%20default%20security%20checks%3F%22%2C%22id%22%3A%22e4ff1b46-4d4f-4d89-9127-c82c418fc685%22%7D" />
    if (req.headers['x-api-key'] === 'secret') return true;
    return super.isAllowed(req, res);
  }
}

// Replace default safety instance
const service = new NetService('yourdomain.com');
service.Safety = new CustomSafety();

```

## 🔌 Events
- `ready`  
- `error`  


## 📦 Cleanup
### ⚠️ This is going to be implemented internally for safety. ⚠️  

Gracefully shut down resources:
```JavaScript
process.on('SIGTERM', async () => {
  await service.Safety.cleanup(); // Clear timers and data
  process.exit(0);
});
```

## 🤝 Contributing
### Issues and PRs welcome!  
### Focus areas:  

- TLS hardening (OCSP stapling, HPKP)  
- Header presets for different use cases  
- Additional middleware helpers  


## 📄 License  
MIT © gidsola