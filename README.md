# @viverse/cf-engine

A composable, tree-shakeable rule engine for migrating **Akamai CDN rules to AWS CloudFront Functions and Lambda@Edge**.

Akamai property rules (criteria + behaviors) map directly to cf-engine's `rule()` primitives. The same logic — redirects, CORS headers, IP allowlists, token auth, image optimization — runs at the CloudFront edge without an Akamai dependency.

```
Akamai property JSON → CLI analyze → CLI generate → cf-engine TypeScript → esbuild → dist/*.js → Terraform
```

## Installation

```bash
# Requires internal registry for @viverse scope
# .npmrc: @viverse:registry=https://vr-ops-internal-npm-registry.vrprod.viveport.com
npm install @viverse/cf-engine
```

## Quick Start

```typescript
import { rule, all, not } from '@viverse/cf-engine'
import { pathPrefix, ipCidr, methodIs } from '@viverse/cf-engine/criteria'
import { redirect, constructResponse, setSecurityHeaders } from '@viverse/cf-engine/behaviors'
import { defineViewerRequest } from '@viverse/cf-engine/adapters/cf-function'

export default defineViewerRequest([
  rule(not(ipCidr(['10.0.0.0/8', '172.16.0.0/12'])), redirect(302, '/blocked')),
  rule(methodIs(['OPTIONS']), constructResponse({ statusCode: 200, body: 'ok' })),
  rule(setSecurityHeaders()),
])
```

Build and deploy:

```bash
esbuild viewer-request.ts \
  --bundle --minify --target=es2017 \
  --supported:for-of=false --supported:template-literal=false --supported:arrow=false \
  --format=iife --global-name=handler \
  --outfile=dist/viewer-request.js
# Append handler unwrap for IIFE compatibility:
echo 'handler=handler.default||handler;' >> dist/viewer-request.js
```

## Concepts

Rules are composed of an optional **criteria** guard and a **behavior**. If criteria is omitted, the behavior always runs.

```typescript
rule(criteria?, behavior)   // with or without criteria guard

all([criteriaA, criteriaB])   // AND
any([criteriaA, criteriaB])   // OR
not(criteria)               // NOT
```

**Adapters** normalize CloudFront's event format so the same rule definitions work across both runtimes:

| Adapter | Import | Use for |
|---|---|---|
| CF Function | `@viverse/cf-engine/adapters/cf-function` | `viewer-request`, `viewer-response` |
| Lambda@Edge | `@viverse/cf-engine/adapters/lambda-edge` | `viewer-request`, `viewer-response` |

## Akamai → CloudFront Mapping

### Criteria

| Function | Description |
|---|---|
| `pathPrefix(prefixes)` | URI starts with any prefix in the array |
| `pathEquals(paths)` | URI exactly matches any path in the array |
| `pathMatches(patterns)` | URI matches any wildcard pattern (`*`, `?`) in the array |
| `hostnameIs(hosts)` | Host header matches any host in the array |
| `methodIs(methods)` | HTTP method matches any method in the array |
| `fileExtension(exts)` | URI file extension matches any extension in the array |
| `headerEquals(name, values)` | Request header equals any value in the array |
| `headerContains(name, substring)` | Request header contains substring |
| `ipCidr(cidrs)` | Client IP is within any CIDR range in the array |
| `countryIs(codes)` | `CloudFront-Viewer-Country` matches any ISO code in the array |
| `userAgentMatches(patterns)` | User-Agent matches any wildcard pattern in the array |

### Behaviors (`@viverse/cf-engine/behaviors`)

| Function | CF Function | Lambda@Edge |
|---|---|---|
| `redirect(status, url)` | ✅ | ✅ |
| `rewriteUri(mode, value)` | ✅ | ✅ |
| `constructResponse(options)` | ✅ | ✅ |
| `setRequestHeader(name, value)` | ✅ | ✅ |
| `copyHeader(from, to)` | ✅ | ✅ |
| `setResponseHeader(name, value)` | ✅ | ✅ |
| `removeResponseHeaders(names)` | ✅ | ✅ |
| `setCorsHeaders(options)` | ✅ | ✅ |
| `stripQueryParams(params)` | ✅ | ✅ |
| `setSecurityHeaders(options)` | ✅ | ✅ |
| `setCacheControl(options)` | ✅ | ✅ |
| `setCsp(options)` | ✅ | ✅ |
| `directoryIndex(file)` | ✅ | ✅ |
| `imageOptimize(options)` | ✅ | ✅ |
| `verifyToken(options)` | ❌ | ✅ |

## Helpers (`@viverse/cf-engine/helpers`)

Helpers are pre-configured rule factories that combine multiple criteria and behaviors for common use cases.

### sendCountryCode

Copies the `CloudFront-Viewer-Country` header to a custom header (default: `x-htc-request-country-code`).

```typescript
import { sendCountryCode } from '@viverse/cf-engine/helpers'

rule(sendCountryCode())
rule(sendCountryCode('x-custom-country'))
```

### stagingIndicator

Adds `x-cf-distribution: staging` to the response when the request carries `aws-cf-cd-staging: true`. Use in `viewer-response` configs shared between the primary and staging distributions so clients can confirm via DevTools or curl which distribution served the request.

```typescript
import { stagingIndicator } from '@viverse/cf-engine/helpers'

defineViewerResponse([
  setCorsHeaders({ allowedOrigins: ['https://www.viverse.com'] }),
  stagingIndicator(),
])
```

Primary distribution requests do not carry `aws-cf-cd-staging`, so the rule is a no-op there.

### viverseWhitelist

Enforces IP and User-Agent allowlists for HTC internal access. Designed for stage environments — blocks unknown clients with a 302 redirect.

**Default allowlists** (HTC internal):
- **CIDRs**: HTC offices (61.218.44.76/32, 122.147.213.24/32, 60.251.61.121/32, 162.120.184.42/32), VPN (175.98.157.254/32, 122.147.173.254/32), stage VPCs (52.33.9.56/32, 52.35.160.39/32, 50.112.203.191/32)
- **User-Agents**: `*HTCVRSDET*`, `*Prerender*`, `*HTC3PARTY*`

```typescript
import { viverseWhitelist } from '@viverse/cf-engine/helpers'

viverseWhitelist({ redirectUrl: 'https://www.viverse.com' })

viverseWhitelist({
  redirectUrl: 'https://www.viverse.com',
  additionalCidrs: ['198.51.100.0/24'],
  additionalUAs: ['*CustomBot*'],
  bypassPaths: ['/api/*', '/health'],
})
```

**Parameters:**
- `redirectUrl` (required): Where to redirect blocked requests
- `additionalCidrs`: Project-specific CIDRs merged with defaults
- `additionalUAs`: Project-specific user agents merged with defaults
- `bypassPaths`: Paths exempt from whitelist checks (supports wildcards)

## CF Function vs Lambda@Edge

| | CF Function | Lambda@Edge |
|---|---|---|
| Bundle size limit | **10 KB** | 1 MB (viewer), 50 MB (origin) |
| Runtime | ES 5.1 + select ES6–12 (see AWS docs) | Node.js 20.x |
| Cold start | ~1 ms | ~100 ms |
| Max execution time | 1 ms | 5 s (viewer) |
| Environment variables | ❌ | ✅ (origin events only) |
| Node.js `crypto` | ❌ | ✅ |

**Use CF Function** for: redirects, header manipulation, CORS, rewrites, IP allowlists.

**Use Lambda@Edge** for: HMAC token validation (`verifyToken`), any behavior requiring Node.js APIs.

## Bundle Size

CF Functions have a **10 KB post-minification limit**. cf-engine is fully tree-shakeable — only imported behaviors and criteria enter the bundle.

Rough estimates per rule type:
- Base overhead ≈ 2 KB
- Redirect rule ≈ 150–200 bytes
- CIDR check ≈ 50 bytes

If a bundle exceeds ~8 KB, split heavy rule groups into a Lambda@Edge and route via CloudFront path-pattern behaviors.

## Build

**CF Function:**

```bash
esbuild viewer-request.ts \
  --bundle --minify --target=es2017 \
  --supported:for-of=false --supported:template-literal=false --supported:arrow=false \
  --format=iife --global-name=handler \
  --outfile=dist/viewer-request.js
# Append handler unwrap for IIFE compatibility:
echo 'handler=handler.default||handler;' >> dist/viewer-request.js
```

**Lambda@Edge:**

```bash
esbuild lambda-viewer-request.ts \
  --bundle --minify --platform=node --target=node20 \
  --format=cjs \
  --outfile=dist/lambda-viewer-request.js
```

> `dist/` must be committed in consumer repos — Terraform reads built files at `plan` time and cannot invoke a build step.

## CF JS 2.0 Compatibility

> **v1.1.0 Breaking Change**: All criteria and combinator functions now accept arrays instead of variadic arguments.
> `ipCidr('a', 'b')` → `ipCidr(['a', 'b'])`, `all(fn1, fn2)` → `all([fn1, fn2])`.

cf-engine source code is written to be directly compatible with the CloudFront JS 2.0 runtime. The runtime is documented as ES 5.1 compliant with select ES6–12 features, but in practice the parser rejects several ES6+ syntax patterns inside esbuild-minified IIFE bundles — even some that the official docs claim are supported.

### Build flags (required for CF Function targets)

```bash
esbuild --target=es2017 \
  --supported:for-of=false \
  --supported:template-literal=false \
  --supported:arrow=false \
  --format=iife --global-name=handler
# Then append: echo 'handler=handler.default||handler;' >> output.js
```

The handler unwrap is needed because esbuild IIFE wraps the export as `{default: fn}`, but CF expects a bare `handler` function.

### Syntax avoided in cf-engine source

These patterns are NOT used anywhere in cf-engine, so esbuild cannot emit them regardless of flags:

| Pattern | Why avoided |
|---------|------------|
| `for...of` | Not in CF JS 2.0 statement list |
| Object/array spread `{...x}` `[...x]` | Not documented as supported |
| Rest parameters `...args` | Fails in minified IIFE bundles |
| Destructuring `[a, b] = arr` | Fails in minified IIFE bundles |
| Default parameters `f(x = 1)` | Not documented as supported |
| `new Map` / `new Set` | Not documented as supported |

### Syntax handled by esbuild flags

| Pattern | esbuild flag | What esbuild does |
|---------|-------------|-------------------|
| Arrow functions `=>` | `--supported:arrow=false` | Converts to `function` |
| Template literals `` ` `` | `--supported:template-literal=false` | Converts to string concat |
| `for...of` | `--supported:for-of=false` | Converts to index loop |
| Optional chaining `?.` | `--target=es2017` | Auto-downleveled |
| Nullish coalescing `??` | `--target=es2017` | Auto-downleveled |

## Development

```bash
npm run build      # tsup
npm run typecheck  # tsc --noEmit
npm test           # vitest
```

See `samples/` for complete working examples.

