import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { elysiaHelmet } from "../src/index";

describe("elysiaHelmet", () => {
    it("should set default security headers", async () => {
        const app = new Elysia()
            .use(elysiaHelmet())
            .get("/", () => "ok");

        const response = await app.handle(new Request("http://localhost/"));

        expect(response.headers.get("X-Frame-Options")).toBe("DENY");
        expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
        expect(response.headers.get("X-XSS-Protection")).toBe("1; mode=block");
        expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
        expect(response.headers.get("Content-Security-Policy")).toBeDefined();
    });

    it("should not overwrite existing headers", async () => {
        const app = new Elysia()
            .derive(({ set }) => {
                set.headers["X-Existing"] = "Exists";
            })
            .use(elysiaHelmet())
            .get("/", () => "ok");

        const response = await app.handle(new Request("http://localhost/"));

        expect(response.headers.get("X-Existing")).toBe("Exists");
        expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    });

    it("should generate a valid nonce when enabled", async () => {
        const app = new Elysia()
            .use(elysiaHelmet({
                csp: {
                    useNonce: true,
                    scriptSrc: ["'self'"]
                }
            }))
            .get("/", () => "ok");

        const response = await app.handle(new Request("http://localhost/"));
        const csp = response.headers.get("Content-Security-Policy");
        const nonceHeader = response.headers.get("X-Nonce");

        expect(nonceHeader).toBeDefined();
        // Base64 regex
        expect(nonceHeader).toMatch(/^[a-zA-Z0-9+/]+={0,2}$/);
        expect(csp).toContain(`'nonce-${nonceHeader}'`);
    });

    it("should support custom headers", async () => {
        const app = new Elysia()
            .use(elysiaHelmet({
                customHeaders: {
                    "X-Custom-Test": "Value"
                }
            }))
            .get("/", () => "ok");

        const response = await app.handle(new Request("http://localhost/"));
        expect(response.headers.get("X-Custom-Test")).toBe("Value");
    });

    it("should expose nonce to the context", async () => {
        let capturedNonce: string | undefined;

        const app = new Elysia()
            .use(elysiaHelmet({
                csp: {
                    useNonce: true,
                    scriptSrc: ["'self'"]
                }
            }))
            .get("/", ({ nonce }) => {
                capturedNonce = nonce;
                return "ok";
            });

        await app.handle(new Request("http://localhost/"));

        expect(capturedNonce).toBeDefined();
        expect(capturedNonce).toMatch(/^[a-zA-Z0-9+/]+={0,2}$/);
    });

    it("should not expose nonce when useNonce is false", async () => {
        let capturedNonce: string | undefined;

        const app = new Elysia()
            .use(elysiaHelmet({
                csp: {
                    useNonce: false
                }
            }))
            .get("/", ({ nonce }) => {
                capturedNonce = nonce;
                return "ok";
            });

        await app.handle(new Request("http://localhost/"));

        expect(capturedNonce).toBeUndefined();
    });
});
