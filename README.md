
# NetService

**A secure, production-ready custom server for Next.js with built-in TLS and security headers.**

MicroService simplifies HTTPS deployment for Next.js apps while enforcing modern security best practices. It automatically handles TLS configuration, security headers, and environment detection—so you don’t have to.

---

## ✨ Features

- **Automatic TLS 1.2/1.3** – HTTPS in production, HTTP for localhost
- **Security Headers** – Preconfigured CSP, HSTS, XSS protection, and more
- **Event-Driven** – Extend with custom logic via `on('ready')`, error handlers, etc.
- **Next.js Integration** – Works seamlessly with Next.js’s `customServer` API
- **Dev/Prod Parity** – Consistent behavior across environments

---

## 🚀 Quick Start

### Install
```bash
npm install @yourscope/microservice
```

### Basic Usage
```javascript
import MicroService from 'microservice';

const service = new MicroService('yourdomain.com'); // Auto-detects dev/prod

service.on('ready', () => {
  console.log(`Server running on ${service.development ? 'http://localhost' : 'https://yourdomain.com'}`);
});
```

---

## 🔧 Configuration

### Environment Variables (`.env`)
```env
DEV="localhost"          # Dev mode if DEV === DOMAIN
DOMAIN="yourdomain.com"  # Production domain
DIR_SSL="/path/to/certs/" # Full path to SSL certificates
TLS_CIPHERS="..."        # OpenSSL cipher string (optional)
TLS_MINVERSION="TLSv1.2" # Minimum TLS version (optional)
TLS_MAXVERSION="TLSv1.3" # Maximum TLS version (optional)
```

### SSL Certificates
Place these files in `DIR_SSL`:
- **Production**: `private.key`, `certificate.crt`, `ca_bundle.crt` (optional)
- **Development**: Generate self-signed certs (see below)

#### Generate Self-Signed Certs (Dev)
```bash
openssl req -x509 -out localhost.crt -keyout localhost.key \
  -newkey rsa:2048 -nodes -sha256 \
  -subj '/CN=localhost' -extensions EXT -config <( \
   printf "[dn]\nCN=localhost\n[req]\ndistinguished_name=dn\n[EXT]\nsubjectAltName=DNS:localhost\nkeyUsage=digitalSignature\nextendedKeyUsage=serverAuth")
```

---

## 🛡 Security

### Headers (Auto-Applied)
- `Strict-Transport-Security`
- `Content-Security-Policy`
- `X-Frame-Options`, `X-XSS-Protection`, and more

### Custom Safety Rules
Extend the `Safety` class to add:
- IP whitelisting/blacklisting
- Rate limiting
- Maintenance mode

Example:
```javascript
class MySafety extends Safety {
  async isAllowed(req, res) {
    if (req.ip === '127.0.0.1') return true; // Allow localhost
    return super.isAllowed(req, res); // Default checks
  }
}
```

---

## 🔌 Events

| Event      | Description                     |
|------------|---------------------------------|
| `ready`    | Server started                  |
| `error`    | Server error occurred           |
| `stream`   | HTTP/2 stream received          |

```javascript
service.on('error', (err) => {
  console.error('Server error:', err);
});
```

---

## 📦 Cleanup

Gracefully shut down resources:
```javascript
process.on('SIGTERM', async () => {
  await service.Safety.cleanup();
  process.exit(0);
});
```

---

## 🤝 Contributing
Issues and PRs welcome! Focus areas:
- TLS hardening (e.g., OCSP stapling)
- Header presets (e.g., for APIs vs. SPAs)
- Middleware support

---

## 📄 License
MIT © [gidsola](https://goodsie.ca)
