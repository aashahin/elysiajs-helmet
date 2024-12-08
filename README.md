# Elysia Helmet

A comprehensive security middleware for Elysia.js applications that helps secure your apps by setting various HTTP headers.

[![NPM Version](https://img.shields.io/npm/v/elysiajs-helmet)](https://www.npmjs.com/package/elysiajs-helmet)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🛡️ Content Security Policy (CSP)
- 🔒 X-Frame-Options protection
- 🚫 XSS Protection
- 🌐 DNS Prefetch Control
- 📜 Referrer Policy
- 🔑 Permissions Policy
- 🔐 HTTP Strict Transport Security (HSTS)
- 🌍 Cross-Origin Resource Policy (CORP)
- 🚪 Cross-Origin Opener Policy (COOP)
- 📝 Report-To header configuration
- ✨ Custom headers support

## Installation

```bash
bun add elysiajs-helmet
```

## Basic Usage

```typescript
import { Elysia } from 'elysia'
import { elysiaHelmet } from 'elysiajs-helmet'

const app = new Elysia()
  .use(elysiaHelmet({}))
  .get('/', () => 'Hello, Secure World!')
  .listen(3000)
```

> **Note**: Production mode is automatically enabled when `NODE_ENV` is set to `'production'`. In production mode, additional security measures are enforced.

## Advanced Configuration

```typescript
import { Elysia } from 'elysia'
import { elysiaHelmet } from 'elysiajs-helmet'

const app = new Elysia()
  .use(elysiaHelmet({
    csp: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      useNonce: true
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    frameOptions: 'DENY',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: {
      camera: ["'none'"],
      microphone: ["'none'"]
    }
  }))
  .listen(3000)
```

## Configuration Options

### Content Security Policy (CSP)

```typescript
interface CSPConfig {
    defaultSrc?: string[];
    scriptSrc?: string[];
    styleSrc?: string[];
    imgSrc?: string[];
    fontSrc?: string[];
    connectSrc?: string[];
    frameSrc?: string[];
    objectSrc?: string[];
    baseUri?: string[];
    reportUri?: string;
    useNonce?: boolean;
    reportOnly?: boolean;
}
```

### HSTS Configuration

```typescript
interface HSTSConfig {
    maxAge?: number;
    includeSubDomains?: boolean;
    preload?: boolean;
}
```

### Report-To Configuration

```typescript
interface ReportToConfig {
    group: string;
    maxAge: number;
    endpoints: Array<{
        url: string;
        priority?: number;
        weight?: number;
    }>;
    includeSubdomains?: boolean;
}
```

## Default Configuration

The middleware comes with secure defaults:

- CSP with `'self'` as default source
- Frame options set to `DENY`
- XSS Protection enabled
- DNS Prefetch Control disabled
- Strict Referrer Policy
- And more secure defaults

You can override any of these defaults by passing your own configuration.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](https://github.com/aashahin/elysiajs-helmet/blob/main/LICENSE)
