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
import { Elysia } from "elysia";
import { elysiaHelmet } from "elysiajs-helmet";

const app = new Elysia()
  .use(elysiaHelmet({}))
  .get("/", () => "Hello, Secure World!")
  .listen(3000);
```

> **Note**: Production mode is automatically enabled when `NODE_ENV` is set to `'production'`. In production mode, additional security measures are enforced.

## Advanced Configuration

```typescript
import { Elysia } from "elysia";
import { elysiaHelmet, permission } from "elysiajs-helmet";

const app = new Elysia()
  .use(
    elysiaHelmet({
      csp: {
        defaultSrc: [permission.SELF],
        scriptSrc: [permission.SELF, permission.UNSAFE_INLINE],
        styleSrc: [permission.SELF, permission.UNSAFE_INLINE],
        imgSrc: [permission.SELF, permission.DATA, permission.HTTPS],
        useNonce: true,
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameOptions: "DENY",
      referrerPolicy: "strict-origin-when-cross-origin",
      permissionsPolicy: {
        camera: [permission.NONE],
        microphone: [permission.NONE],
      },
    })
  )
  .listen(3000);
```

## Types Usage

```typescript
import type { CSPConfig, HSTSConfig, ReportToConfig, SecurityConfig } from "elysiajs-helmet";
```

### These types are extremely useful if you want to define configurations in separate files

### See `Configuration Options` below to get the type info

## Configuration Options

### Content Security Policy (CSP)

```typescript
export interface CSPConfig {
  /** Default source directive */
  defaultSrc?: string[];
  /** Script source directive */
  scriptSrc?: string[];
  /** Style source directive */
  styleSrc?: string[];
  /** Image source directive */
  imgSrc?: string[];
  /** Font source directive */
  fontSrc?: string[];
  /** Connect source directive */
  connectSrc?: string[];
  /** Frame source directive */
  frameSrc?: string[];
  /** Object source directive */
  objectSrc?: string[];
  /** Base URI directive */
  baseUri?: string[];
  /** Report URI directive */
  reportUri?: string;
  /** Use nonce for script and style tags */
  useNonce?: boolean;
  /** Report-only mode */
  reportOnly?: boolean;
}
```

### HSTS Configuration

```typescript
export interface HSTSConfig {
  /** Maximum age */
  maxAge?: number;
  /** Include sub-domains */
  includeSubDomains?: boolean;
  /** Preload */
  preload?: boolean;
}
```

### Report-To Configuration

```typescript
export interface ReportToConfig {
  /** Group name for the endpoint */
  group: string;
  /** Maximum age of the endpoint configuration (in seconds) */
  maxAge: number;
  /** Endpoints to send reports to */
  endpoints: Array<{
    url: string;
    priority?: number;
    weight?: number;
  }>;
  /** Include subdomains in reporting */
  includeSubdomains?: boolean;
}
```

### Security Configuration

```typescript
export interface SecurityConfig {
  /** Content Security Policy configuration */
  csp?: CSPConfig;
  /** Enable or disable X-Frame-Options (DENY, SAMEORIGIN, ALLOW-FROM) */
  frameOptions?: "DENY" | "SAMEORIGIN" | "ALLOW-FROM";
  /** Enable or disable XSS Protection */
  xssProtection?: boolean;
  /** Enable or disable DNS Prefetch Control */
  dnsPrefetch?: boolean;
  /** Configure Referrer Policy */
  referrerPolicy?:
    | "no-referrer"
    | "no-referrer-when-downgrade"
    | "origin"
    | "origin-when-cross-origin"
    | "same-origin"
    | "strict-origin"
    | "strict-origin-when-cross-origin"
    | "unsafe-url";
  /** Configure Permissions Policy */
  permissionsPolicy?: Record<string, string[]>;
  /** Configure HSTS (HTTP Strict Transport Security) */
  hsts?: HSTSConfig;
  /** Enable or disable Cross-Origin Resource Policy */
  corp?: "same-origin" | "same-site" | "cross-origin";
  /** Enable or disable Cross-Origin Opener Policy */
  coop?: "unsafe-none" | "same-origin-allow-popups" | "same-origin";
  /** Configure Report-To header */
  reportTo?: ReportToConfig[];
  /** Custom headers to add */
  customHeaders?: Record<string, string>;
}
```

### Permission Configuration

```typescript
export const permission = {
  /** Source: Self allowed */
  SELF: "'self'",
  /** Source: Unsafe Inline allowed */
  UNSAFE_INLINE: "'unsafe-inline'",
  /** Source: HTTPS allowed */
  HTTPS: "https:",
  /** Source: Data allowed */
  DATA: "data:",
  /** Source: None is allowed */
  NONE: "'none'",
  /** Source: Blob allowed */
  BLOB: "blob:",
} as const;
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
