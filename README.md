# @rayselfs/cf-rule-engine

A composable, tree-shakeable rule engine for **AWS CloudFront Functions and Lambda@Edge**.

Define edge rules — redirects, CORS headers, IP allowlists, token auth, image optimization — as plain TypeScript using an Akamai-inspired criteria + behaviors API. Rules are fully tree-shakeable and compile down to CloudFront-compatible JS.

## Installation

```bash
npm install @rayselfs/cf-rule-engine
```

## Quick Start

**viewer-request** — IP blocking and method handling:

```typescript
import { rule, not } from '@rayselfs/cf-rule-engine'
import { ipCidr, methodIs } from '@rayselfs/cf-rule-engine/criteria/index'
import { redirect, constructResponse } from '@rayselfs/cf-rule-engine/behaviors/index'
import { defineViewerRequest } from '@rayselfs/cf-rule-engine/adapters/viewer-request'

export default defineViewerRequest([
  rule(not(ipCidr(['10.0.0.0/8', '172.16.0.0/12'])), redirect(302, '/blocked')),
  rule(methodIs(['OPTIONS']), constructResponse({ statusCode: 200, body: 'ok' })),
])
```

**viewer-response** — security and CORS headers:

```typescript
import { setSecurityHeaders, setCorsHeaders, ORIGIN_WILDCARD } from '@rayselfs/cf-rule-engine/behaviors/index'
import { defineViewerResponse } from '@rayselfs/cf-rule-engine/adapters/viewer-response'

export default defineViewerResponse([
  setSecurityHeaders(),
  setCorsHeaders({ allowedOrigins: ORIGIN_WILDCARD }),
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
not(criteria)                 // NOT

chain([behaviorA, behaviorB]) // sequential: B sees mutations made by A
```

Use `chain()` when one behavior must see the request mutations (URI rewrite, header change) made by a previous behavior. Without `chain()`, each separate `rule()` re-evaluates criteria against the **original** unmodified request.

**Adapters** normalize CloudFront's event format so the same rule definitions work across both runtimes:

| Adapter | Import | Use for |
|---|---|---|
| CF Function (viewer-request) | `@rayselfs/cf-rule-engine/adapters/viewer-request` | `viewer-request` only — tree-shake-friendly |
| CF Function (viewer-response) | `@rayselfs/cf-rule-engine/adapters/viewer-response` | `viewer-response` only — tree-shake-friendly |
| CF Function (combined) | `@rayselfs/cf-rule-engine/adapters/cf-function` | both — backward compat |
| Lambda@Edge | `@rayselfs/cf-rule-engine/adapters/lambda-edge` | `viewer-request`, `viewer-response` |

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
| `headerContains(name, substrings)` | Request header contains any of the substrings (`string[]`) |
| `ipCidr(cidrs)` | Client IP is within any CIDR range in the array |
| `countryIs(codes)` | `CloudFront-Viewer-Country` matches any ISO code in the array |
| `userAgentMatches(patterns)` | User-Agent matches any wildcard pattern in the array |

### Behaviors (`@rayselfs/cf-rule-engine/behaviors/index`)

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

### setCorsHeaders — OriginPolicy

`allowedOrigins` accepts an `OriginPolicy` that controls how `Access-Control-Allow-Origin` is set:

| Value | Behavior |
|---|---|
| `ORIGIN_WILDCARD` (`'*'`) | Static `Access-Control-Allow-Origin: *` — for fully public APIs |
| `Origin[]` | Compare request `Origin` against the list; echo if matched, skip if not. Supports wildcard subdomains (`https://*.example.com`). |
| `ORIGIN_ECHO` (`'echo'`) | Echo any request `Origin` if present, skip if none — use with `allowCredentials: true` |

```typescript
import { setCorsHeaders, ORIGIN_WILDCARD, ORIGIN_ECHO } from '@rayselfs/cf-rule-engine/behaviors/index'

// Public API
setCorsHeaders({ allowedOrigins: ORIGIN_WILDCARD })

// Restricted — echo only listed origins
setCorsHeaders({ allowedOrigins: ['https://*.viverse.com', 'https://sdk-api.viverse.com'] })

// Echo any origin (required when allowCredentials: true)
setCorsHeaders({ allowedOrigins: ORIGIN_ECHO, allowCredentials: true })
```

`allowedMethods` and `allowedHeaders` are optional — omit to exclude those headers from the response.

## Helpers (`@rayselfs/cf-rule-engine/helpers/index`)

Helpers are pre-configured rule factories that combine multiple criteria and behaviors for common use cases.

### sendCountryCode

Copies the `CloudFront-Viewer-Country` header to a custom request header (default: `x-viewer-country`), making the viewer's country code available to the origin server.

```typescript
import { sendCountryCode } from '@rayselfs/cf-rule-engine/helpers/index'

rule(sendCountryCode())                        // copies to x-viewer-country
rule(sendCountryCode('x-custom-country'))      // copies to a custom header
```

### stagingIndicator

Adds `x-cf-distribution: staging` to the response when the request carries `aws-cf-cd-staging: true`. Use in `viewer-response` configs shared between the primary and staging distributions so clients can confirm via DevTools or curl which distribution served the request.

```typescript
import { stagingIndicator } from '@rayselfs/cf-rule-engine/helpers/index'
import { setCorsHeaders, ORIGIN_WILDCARD } from '@rayselfs/cf-rule-engine/behaviors/index'

defineViewerResponse([
  setCorsHeaders({ allowedOrigins: ORIGIN_WILDCARD }),
  stagingIndicator(),
])
```

Primary distribution requests do not carry `aws-cf-cd-staging`, so the rule is a no-op there.

### whitelist

Restricts access by IP CIDR range and/or User-Agent pattern. Requests that don't match any allowed CIDR or User-Agent (and aren't on a bypassed path) are redirected with HTTP 302.

No default allowlists are included — callers must supply all CIDRs and User-Agent patterns explicitly.

```typescript
import { whitelist } from '@rayselfs/cf-rule-engine/helpers/index'

whitelist({
  cidrs: ['203.0.113.0/24', '10.0.0.0/8'],
  userAgents: ['*InternalBot*', '*Prerender*'],
  redirectUrl: 'https://www.example.com',
})

// With bypass paths:
whitelist({
  cidrs: ['203.0.113.0/24'],
  redirectUrl: 'https://www.example.com',
  bypassPaths: ['/api/health', '/robots.txt'],
})
```

**Parameters:**
- `cidrs` (required): CIDR ranges to allow (e.g. office IPs, VPN, stage VPCs)
- `userAgents`: User-Agent wildcard patterns to allow (supports `*` and `?`)
- `redirectUrl` (required): Where to redirect blocked requests
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

