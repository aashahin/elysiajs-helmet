import { Elysia } from "elysia";

/**
 * Configuration interface for Report-To header
 */
interface ReportToConfig {
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

/**
 * Configuration interface for Content Security Policy
 */
interface CSPConfig {
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

/**
 * Configuration interface for Security Headers
 */
interface SecurityConfig {
    /** Content Security Policy configuration */
    csp?: CSPConfig;
    /** Enable or disable X-Frame-Options (DENY, SAMEORIGIN, ALLOW-FROM) */
    frameOptions?: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
    /** Enable or disable XSS Protection */
    xssProtection?: boolean;
    /** Enable or disable DNS Prefetch Control */
    dnsPrefetch?: boolean;
    /** Configure Referrer Policy */
    referrerPolicy?: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' |
        'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
    /** Configure Permissions Policy */
    permissionsPolicy?: Record<string, string[]>;
    /** Configure HSTS (HTTP Strict Transport Security) */
    hsts?: {
        maxAge?: number;
        includeSubDomains?: boolean;
        preload?: boolean;
    };
    /** Enable or disable Cross-Origin Resource Policy */
    corp?: 'same-origin' | 'same-site' | 'cross-origin';
    /** Enable or disable Cross-Origin Opener Policy */
    coop?: 'unsafe-none' | 'same-origin-allow-popups' | 'same-origin';
    /** Configure Report-To header */
    reportTo?: ReportToConfig[];
    /** Custom headers to add */
    customHeaders?: Record<string, string>;
}

const DEFAULT_CSP_CONFIG: CSPConfig = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "blob:"],
    fontSrc: ["'self'"],
    connectSrc: ["'self'"],
    frameSrc: ["'self'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"]
};

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
    csp: DEFAULT_CSP_CONFIG,
    frameOptions: 'DENY',
    xssProtection: true,
    dnsPrefetch: false,
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: {
        camera: [],
        microphone: [],
        geolocation: [],
        'interest-cohort': []
    },
    hsts: {
        maxAge: 15552000,
        includeSubDomains: true,
        preload: true
    },
    corp: 'same-origin',
    coop: 'same-origin'
};

// Pre-computed regex for camelCase to kebab-case conversion
const KEBAB_REGEX = /[A-Z]/g;

// Memoized kebab-case conversions
const kebabCache: Record<string, string> = {};

/**
 * Convert camelCase to kebab-case with memoization
 */
function toKebabCase(str: string): string {
    if (kebabCache[str]) return kebabCache[str];
    const result = str.replace(KEBAB_REGEX, m => '-' + m.toLowerCase());
    kebabCache[str] = result;
    return result;
}

/**
 * Validates security configuration
 */
function validateConfig(config: Partial<SecurityConfig>): void {
    if (config.hsts?.maxAge && config.hsts.maxAge < 0) {
        throw new Error('HSTS maxAge must be a positive number');
    }

    if (config.reportTo) {
        for (const report of config.reportTo) {
            if (report.maxAge < 0) {
                throw new Error('Report-To maxAge must be a positive number');
            }
            if (!report.endpoints.length) {
                throw new Error('Report-To must have at least one endpoint');
            }
        }
    }
}

/**
 * Generates a nonce for CSP using Base64 encoding
 * Uses timestamp for better performance
 */
function generateNonce(): string {
    return Buffer.from(Date.now() + Math.random().toString(36).slice(-6)).toString('base64');
}

/**
 * Converts CSP config object to CSP header string with optimized string concatenation
 */
function buildCSPString(csp: CSPConfig, nonce?: string): string {
    const parts: string[] = [];

    for (const [key, values] of Object.entries(csp)) {
        if (!values?.length || key === 'useNonce' || key === 'reportOnly') continue;

        // Handle nonce injection efficiently
        if (csp.useNonce && nonce && (key === 'scriptSrc' || key === 'styleSrc')) {
            parts.push(`${toKebabCase(key)} ${values.join(' ')} 'nonce-${nonce}'`);
            continue;
        }

        parts.push(`${toKebabCase(key)} ${values.join(' ')}`);
    }

    return parts.join('; ');
}

/**
 * Builds Permissions-Policy header string with optimized string building
 */
function buildPermissionsPolicyString(policies: Record<string, string[]>): string {
    const parts: string[] = [];

    for (const [key, values] of Object.entries(policies)) {
        parts.push(values.length === 0 ? `${key}=()` : `${key}=(${values.join(' ')})`);
    }

    return parts.join(', ');
}

/**
 * Builds Report-To header string with optimized JSON stringification
 */
function buildReportToString(reports: ReportToConfig[]): string {
    // Pre-structure the object to avoid multiple transformations
    const reportObj = reports.map(({ group, maxAge, endpoints, includeSubdomains }) => ({
        group,
        max_age: maxAge,
        endpoints,
        include_subdomains: includeSubdomains
    }));

    return JSON.stringify(reportObj);
}

/**
 * Creates an Elysia middleware that adds security headers to all responses
 * Optimized for performance with minimal object spread operations
 */
export function elysiaHelmet(config: Partial<SecurityConfig> = {}) {
    // Validate configuration only once during initialization
    validateConfig(config);

    const finalConfig: SecurityConfig = {
        ...DEFAULT_SECURITY_CONFIG,
        ...config,
        csp: config.csp ? { ...DEFAULT_CSP_CONFIG, ...config.csp } : DEFAULT_CSP_CONFIG,
        permissionsPolicy: config.permissionsPolicy ?
            { ...DEFAULT_SECURITY_CONFIG.permissionsPolicy, ...config.permissionsPolicy } :
            DEFAULT_SECURITY_CONFIG.permissionsPolicy,
        hsts: config.hsts ?
            { ...DEFAULT_SECURITY_CONFIG.hsts, ...config.hsts } :
            DEFAULT_SECURITY_CONFIG.hsts
    };

    const staticHeaders: Record<string, string> = {};

    if (finalConfig.frameOptions) {
        staticHeaders['X-Frame-Options'] = finalConfig.frameOptions;
    }

    if (finalConfig.xssProtection) {
        staticHeaders['X-XSS-Protection'] = '1; mode=block';
    }

    staticHeaders['X-Content-Type-Options'] = 'nosniff';

    if (finalConfig.referrerPolicy) {
        staticHeaders['Referrer-Policy'] = finalConfig.referrerPolicy;
    }

    if (finalConfig.dnsPrefetch !== undefined) {
        staticHeaders['X-DNS-Prefetch-Control'] = finalConfig.dnsPrefetch ? 'on' : 'off';
    }

    if (finalConfig.corp) {
        staticHeaders['Cross-Origin-Resource-Policy'] = finalConfig.corp;
    }

    if (finalConfig.coop) {
        staticHeaders['Cross-Origin-Opener-Policy'] = finalConfig.coop;
    }

    if (finalConfig.reportTo) {
        staticHeaders['Report-To'] = buildReportToString(finalConfig.reportTo);
    }

    if (finalConfig.customHeaders) {
        Object.assign(staticHeaders, finalConfig.customHeaders);
    }

    const isProduction = process.env.NODE_ENV === 'production';

    const hstsHeader = isProduction && finalConfig.hsts ?
        `max-age=${finalConfig.hsts.maxAge}${
            finalConfig.hsts.includeSubDomains ? '; includeSubDomains' : ''
        }${finalConfig.hsts.preload ? '; preload' : ''}` :
        null;

    return new Elysia()
        .derive({ as: 'global' }, ({ set }) => {
            set.headers = { ...staticHeaders };

            if (finalConfig.csp) {
                const nonce = finalConfig.csp.useNonce ? generateNonce() : undefined;
                const headerName = finalConfig.csp.reportOnly ?
                    'Content-Security-Policy-Report-Only' :
                    'Content-Security-Policy';

                set.headers[headerName] = buildCSPString(finalConfig.csp, nonce);

                if (nonce) {
                    set.headers['X-Nonce'] = nonce;
                }
            }

            if (finalConfig.permissionsPolicy) {
                set.headers['Permissions-Policy'] = buildPermissionsPolicyString(finalConfig.permissionsPolicy);
            }

            if (hstsHeader) {
                set.headers['Strict-Transport-Security'] = hstsHeader;
            }
        });
}