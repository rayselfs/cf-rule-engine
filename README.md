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
  rule(not(ipCidr('10.0.0.0/8', '172.16.0.0/12')), redirect(302, '/blocked')),
  rule(methodIs('OPTIONS'), constructResponse({ statusCode: 200, body: 'ok' })),
  rule(setSecurityHeaders()),
])
```

Build and deploy:

```bash
esbuild viewer-request.ts \
  --bundle --minify --target=es2019 \
  --format=iife --global-name=handler \
  --outfile=dist/viewer-request.js
```

## Concepts

Rules are composed of an optional **criteria** guard and a **behavior**. If criteria is omitted, the behavior always runs.

```typescript
rule(criteria?, behavior)   // with or without criteria guard

all(criteriaA, criteriaB)   // AND
any(criteriaA, criteriaB)   // OR
not(criteria)               // NOT
```

**Adapters** normalize CloudFront's event format so the same rule definitions work across both runtimes:

| Adapter | Import | Use for |
|---|---|---|
| CF Function | `@viverse/cf-engine/adapters/cf-function` | `viewer-request`, `viewer-response` |
| Lambda@Edge | `@viverse/cf-engine/adapters/lambda-edge` | `viewer-request`, `viewer-response` |

## Akamai → CloudFront Mapping

### Criteria

| Akamai | cf-engine |
|---|---|
| `path` (STARTS_WITH) | `pathPrefix(...)` |
| `path` (MATCHES_ONE_OF) | `pathEquals(...)` or `pathMatches(...)` |
| `hostname` | `hostnameIs(...)` |
| `fileExtension` | `fileExtension(...)` |
| `requestHeader` | `headerEquals(...)` / `headerContains(...)` |
| `requestMethod` | `methodIs(...)` |
| `userAgent` | `userAgentMatches(...)` |
| `userLocation` (COUNTRY) | `countryIs(...)` |
| `clientip` | `ipCidr(...)` |
| `matchVariable` | Replace with direct criterion — see variable mapping below |

### Behaviors

| Akamai | cf-engine | Notes |
|---|---|---|
| `redirect` / `redirectplus` | `redirect(status, url)` | |
| `rewriteUrl` | `rewriteUri(mode, value)` | |
| `constructResponse` | `constructResponse(options)` | |
| `modifyOutgoingResponseHeader` SET | `setResponseHeader(name, value)` | |
| `modifyOutgoingResponseHeader` DELETE | `removeResponseHeaders([...names])` | |
| `modifyOutgoingRequestHeader` SET | `setRequestHeader(name, value)` | |
| `modifyOutgoingRequestHeader` copy | `copyHeader(from, to)` | |
| `httpStrictTransportSecurity` | `setSecurityHeaders()` | HSTS included |
| `removeQueryParameter` | `stripQueryParams([...params])` | |
| `imageManager` + `imOverride` | `imageOptimize(options)` | imgproxy URL rewrite |
| `verifyTokenAuthorization` | `verifyToken(options)` | Lambda@Edge only |
| `caching` (TTL) | `setCacheControl(options)` | max-age only |

### Akamai Variable System

`setVariable` + `matchVariable` patterns map to direct criteria:

| Akamai Variable | cf-engine Equivalent |
|---|---|
| `setVariable(PMUSER_USER_COUNTRY_CODE, EDGESCAPE)` | `countryIs(...)` — reads `CloudFront-Viewer-Country` |
| `setVariable(PMUSER_HEADER_ORIGIN)` | `headerEquals('origin', ...)` |
| `setVariable(PMUSER_USER_AGENT_TRUNCATED)` | `userAgentMatches(...)` |

### Skip These

`cpCode`, `datastream`, `sureRoute`, `tieredDistribution`, `prefetch`, `cacheTagVisible`, `dnsAsyncRefresh` — Akamai-proprietary, no CloudFront equivalent.

`origin`, `allowPost`, `gzipResponse`, `downstreamCache`, `webSockets` — CloudFront distribution config, handled by Terraform not cf-engine.

## Available APIs

### Criteria (`@viverse/cf-engine/criteria`)

| Function | Description |
|---|---|
| `pathPrefix(...prefixes)` | URI starts with any of the given prefixes |
| `pathEquals(...paths)` | URI exactly matches |
| `pathMatches(...patterns)` | URI matches wildcard pattern (`*`, `?`) |
| `hostnameIs(...hosts)` | Host header matches |
| `methodIs(...methods)` | HTTP method matches |
| `fileExtension(...exts)` | URI file extension matches |
| `headerEquals(name, ...values)` | Request header equals one of the values |
| `headerContains(name, substring)` | Request header contains substring |
| `ipCidr(...cidrs)` | Client IP is within any CIDR range |
| `countryIs(...codes)` | `CloudFront-Viewer-Country` matches ISO code |
| `userAgentMatches(...patterns)` | User-Agent matches wildcard pattern |

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

## CF Function vs Lambda@Edge

| | CF Function | Lambda@Edge |
|---|---|---|
| Bundle size limit | **10 KB** | 1 MB (viewer), 50 MB (origin) |
| Runtime | ES2019 (no Node.js APIs) | Node.js 20.x |
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
  --bundle --minify --target=es2019 \
  --format=iife --global-name=handler \
  --outfile=dist/viewer-request.js
```

**Lambda@Edge:**

```bash
esbuild lambda-viewer-request.ts \
  --bundle --minify --platform=node --target=node20 \
  --format=cjs \
  --outfile=dist/lambda-viewer-request.js
```

> `dist/` must be committed in consumer repos — Terraform reads built files at `plan` time and cannot invoke a build step.

## Development

```bash
npm run build      # tsup
npm run typecheck  # tsc --noEmit
npm test           # vitest
```

See `samples/` for complete working examples.

