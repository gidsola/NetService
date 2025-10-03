# NetService

*A production-grade custom server for Next.js with built-in TLS, security headers, and middleware support.*

NetService abstracts HTTPS configuration, enforces security best practices, and ensures consistent behavior across development and production environments, letting you focus on building your application.

---

## Key Features

| Feature                     | Description                                                                 |
|-----------------------------|-----------------------------------------------------------------------------|
| **Automatic TLS**           | HTTPS in production (TLS 1.2/1.3), HTTP for `localhost`                    |
| **Security Headers**        | Preconfigured CSP, HSTS, XSS protection, and more                          |
| **Middleware Pipeline**     | Modular request processing (rate limiting, blocking, etc.)                 |
| **Event-Driven Architecture** | Hook into lifecycle events (`ready`, `error`, etc.)                       |
| **Next.js Compatibility**   | Drop-in replacement for `next start` with `customServer` support           |
| **Environment Parity**      | Uniform behavior across development and production                         |

---

## Quick Start

### Installation
```bash
npm install netservice
```

---

## Configuration

### Prerequisites
For port-binding permissions (Linux):
```bash
sudo setcap 'cap_net_bind_service=+ep' \$(which node)
```

### Environment Variables
Add to `.env`:
```env
DOMAIN="yourdomain.com"      # Production domain ('localhost' for dev)
DIR_SSL="/path/to/certs/"    # Path to SSL certificates
TLS_CIPHERS="..."            # OpenSSL cipher string (optional)
TLS_MINVERSION="TLSv1.2"     # Minimum TLS version
TLS_MAXVERSION="TLSv1.3"     # Maximum TLS version
```

### SSL Certificates
Place in `DIR_SSL`:
- **Production:** `private.key`, `certificate.crt`, `ca_bundle.crt`
- **Development (Optional):** `localhost.key`, `localhost.crt`

#### Generate Self-Signed Certificates (Dev)
```bash
openssl req -x509 -out localhost.crt -keyout localhost.key \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' -extensions EXT -config <( \
   printf "[dn]\nCN=localhost\n[req]\ndistinguished_name=dn\n[EXT]\nsubjectAltName=DNS\:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
```

---

## Basic Usage with Middleware built-ins  

### Built-in Middleware
- `mwRateLimit()`: Rate-limiting by IP/URL (10 requests/10s default)
- `mwBlockList()`: Block specific paths  

🔍 The middlewares `register` method returns context for chainability.  

```javascript
import NetService from 'netservice';

const netservice = new NetService('yourdomain.com'); // Use 'localhost' for development
netservice
  .on('ready', async () => logger().info(chalk.greenBright('<< Ready >>'))); // simulated logger function

// Order of implement matters.
netservice.MiddlewareMgr
  .register('*', netservice.Safety.mwBlockList()) // registered first, runs before any others.
  .register('*', netservice.Safety.mwRateLimit()); // registered second, runs only if the prior middleware returns `undefined`  

```

## Middleware

### Custom Middleware Example
```javascript
const netservice = new NetService('yourdomain.com');

netservice.middlewareMgr.register('/api', async (req, res) => {
  if (!req.headers.authorization) {
    return res.writeHead(401).end('Unauthorized'); // Returning a ServerResponse of any kind ends our request processing.
  }
  return; // returns undefined and we execute the next middleware
});

```

#### Middleware Signature (TypeScript)
```typescript
type Middleware = (
  req: IncomingMessage,
  res: ServerResponse
) => Promise<undefined | ServerResponse>;
```

---

## Security

### Default Protections
- **TLS Enforcement:** Automatic HTTPS in production
- **Rate Limiting:** Configurable thresholds
- **Security Headers:** Applied to all responses

#### Default Headers
| Header                     | Value                                                                 |
|----------------------------|-----------------------------------------------------------------------|
| `Strict-Transport-Security`| `max-age=31536000; includeSubDomDomains; preload`                     |
| `Content-Security-Policy`  | Restricts scripts, styles, and media sources                         |
| `X-Frame-Options`          | `SAMEORIGIN`                                                          |
| `X-Content-Type-Options`   | `nosniff`                                                             |
| `X-XSS-Protection`         | `1; mode=block`                                                       |
| `Permissions-Policy`       | Disables sensitive APIs (camera, geolocation, etc.)                  |

---

## Events

| Event   | Description                          |
|---------|--------------------------------------|
| `ready` | Server startup completion            |
| `error` | Critical failure notifications       |

---

## Contributing

We welcome contributions! Focus areas:
- TLS hardening (OCSP stapling, HPKP)
- Header presets for specialized use cases
- Additional middleware utilities

**License:** MIT © [gidsola](https://github.com/gidsola)
