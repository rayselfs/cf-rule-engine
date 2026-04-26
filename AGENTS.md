# AGENTS.md — @viverse/cf-engine

## Purpose

This repo provides a composable, tree-shakeable rule engine for **AWS CloudFront Functions and Lambda@Edge**, replacing Akamai CDN rules for VIVERSE properties.

The primary workflow is:
```
Akamai property JSON → CLI analyze → CLI generate → cf-engine TypeScript → tsup build → dist/*.js → Terraform
```

---

## Repository Structure

```
src/
  core/
    types.ts          # HttpRequest, HttpResponse, CriteriaFn, BehaviorFn, ResponseBehaviorFn, Rule
    rule.ts           # rule(), all(), any(), not(), runRules()
  shared/
    cidr.ts           # CIDR matching utilities
    wildcard.ts       # Wildcard pattern matching
  criteria/           # 11 criteria: pathPrefix, pathEquals, pathMatches, hostnameIs,
                      #   methodIs, ipCidr, headerEquals, headerContains,
                      #   fileExtension, countryIs, userAgentMatches
  behaviors/          # 14 behaviors: redirect, rewriteUri, constructResponse,
                      #   directoryIndex, setRequestHeader, copyHeader,
                      #   setResponseHeader, removeResponseHeaders, setCorsHeaders,
                      #   stripQueryParams, setCsp, setCacheControl, setSecurityHeaders,
                      #   imageOptimize
  adapters/
    cf-function.ts    # defineViewerRequest(), defineViewerResponse()
    lambda-edge.ts    # defineViewerRequest(), defineViewerResponse()
scripts/
  analyze-akamai.ts   # CLI: analyze Akamai JSON → report + split recommendation
  generate-rules.ts   # CLI: Akamai JSON → cf-engine TypeScript draft
.agents/skills/
  akamai-migration/
    SKILL.md          # Step-by-step migration workflow for agents
tests/
samples/
  stream-stage/       # Working consumer example
```

---

## Akamai → cf-engine Behavior Mapping

### ✅ Direct Mapping

| Akamai Behavior | cf-engine Behavior | Notes |
|---|---|---|
| `redirect` | `redirect` | Check `statusCode`, `destinationPath` options |
| `redirectplus` | `redirect` | Uses expression-based destinations — may need manual adjustment |
| `modifyOutgoingResponseHeader` (set) | `setResponseHeader` | `action: 'SET'` |
| `modifyOutgoingResponseHeader` (delete) | `removeResponseHeaders` | `action: 'DELETE'` |
| `rewriteUrl` | `rewriteUri` | |
| `constructResponse` | `constructResponse` | |
| `httpStrictTransportSecurity` | `setSecurityHeaders` | HSTS is included |
| `removeQueryParameter` | `stripQueryParams` | |
| `imageManager` + `imOverride` | `imageOptimize` | Supports `imwidth`/`imformat` query params |
| `caching` (TTL override) | `setCacheControl` | Partial — max-age only |
| `modifyOutgoingRequestHeader` | `setRequestHeader` | |

### ❌ Akamai-Specific — No CF Equivalent (SKIP)

These behaviors are Akamai proprietary and have no CloudFront equivalent. **Do not attempt to migrate them.**

| Akamai Behavior | Reason to Skip |
|---|---|
| `cpCode` | Akamai traffic reporting |
| `datastream` / `report` | Akamai DataStream (use CloudWatch instead) |
| `sureRoute` | Akamai performance routing |
| `tieredDistribution` | Akamai tiered caching (CF has its own) |
| `prefetch` / `prefetchable` | Akamai prefetch |
| `cacheTagVisible` | Akamai cache tagging |
| `dnsAsyncRefresh` | Akamai DNS optimization |
| `allHttpInCacheHierarchy` | Akamai cache hierarchy |

### ⚙️ CloudFront Distribution Config — Not a Function (Terraform handles)

These are handled by CloudFront distribution settings, NOT by cf-engine functions.

| Akamai Behavior | CF Config |
|---|---|
| `origin` | `aws_cloudfront_distribution` origins block |
| `allowPost` / `allowOptions` / `allowDelete` etc. | `allowed_methods` in cache behavior |
| `webSockets` | `aws_cloudfront_distribution` WebSocket support |
| `downstreamCache` | CF Cache Policies |
| `gzipResponse` | `compress = true` in cache behavior |
| `http2` | CF enables by default |
| `allowTransferEncoding` | CF handles natively |

### ⚠️ Akamai Variable System (`setVariable` / `matchVariable`)

Akamai uses a variable system (`PMUSER_*`) for cross-rule state. Common patterns and their cf-engine equivalents:

| Akamai Pattern | cf-engine Equivalent |
|---|---|
| `setVariable(PMUSER_USER_COUNTRY_CODE, EDGESCAPE)` + `matchVariable` | `countryIs(...)` criterion — CF provides `CloudFront-Viewer-Country` header natively |
| `setVariable(PMUSER_HEADER_ORIGIN)` + `matchVariable` | `headerEquals('origin', ...)` criterion |
| `setVariable(PMUSER_USER_AGENT_TRUNCATED)` + `matchVariable` | `userAgentMatches(...)` criterion |
| `setVariable(PMUSER_CACHE_ID)` | Cache key customization → CF Cache Policies (Terraform) |
| `setVariable(PMUSER_HTC_TARGET_DC)` | Origin routing → CF Origins / Origin Groups (Terraform) |
| `setVariable(PMUSER_VIVEPORT_CN_IM)` | Image Manager conditional → `imageOptimize` with criteria |

**Rule**: When you see `setVariable` + `matchVariable`, trace the variable name to understand what it extracts, then replace the entire pattern with the appropriate cf-engine criterion.

---

## Akamai → cf-engine Criteria Mapping

| Akamai Criterion | cf-engine Criterion |
|---|---|
| `path` (MATCHES_ONE_OF) | `pathEquals` or `pathMatches` |
| `path` (STARTS_WITH) | `pathPrefix` |
| `hostname` | `hostnameIs` |
| `fileExtension` | `fileExtension` |
| `requestHeader` | `headerEquals` / `headerContains` |
| `requestMethod` | `methodIs` |
| `userAgent` | `userAgentMatches` |
| `userLocation` (COUNTRY) | `countryIs` |
| `cacheability` | **Skip** — no cf-engine equivalent |
| `contentType` | Use `headerEquals('content-type', ...)` on response behavior |
| `matchVariable` | Replace with direct criterion (see variable mapping above) |

---

## 10KB CF Function Limit — Decision Tree

CF Functions have a **10KB bundle size limit** (post-minification). This is the most critical constraint.

```
Estimate bundle size:
  - Each redirect rule ≈ 150–200 bytes in bundle
  - Each IP CIDR rule ≈ 50 bytes
  - Base overhead ≈ 2KB

Total redirects × 175 + total CIDRs × 50 + 2000 > 8000 bytes?
  ├── YES → Split: extract redirect/ban rules to Lambda@Edge
  │         Route via CF behavior path patterns
  └── NO  → All rules in CF Function
```

### Splitting Strategy

When splitting is needed:

1. **Identify "fat" rule groups** — typically redirect tables and IP ban lists
2. **Group by path prefix** — each group becomes a separate Lambda@Edge
3. **CF Distribution behavior** — add a path-pattern behavior that routes to the Lambda
4. **Remaining rules** — stay in CF Function (security headers, CORS, simple rewrites)

**Example split for www.viverse.com (36 redirects):**
```
CF Function (viewer-request):
  → setSecurityHeaders
  → setCorsHeaders
  → block specific user agents (constructResponse)
  → simple path rewrites

Lambda@Edge (viewer-request) — bound to behavior path: /birdie-wing/*
  → birdie-wing locale redirects

Lambda@Edge (viewer-request) — bound to behavior path: /profile/* (or default)
  → profile blacklist redirects

Lambda@Edge (viewer-request) — bound to behavior: MKT paths
  → MKT redirect table (18 rules)
```

**Properties requiring split:**

| Property | Redirects | Recommendation |
|---|---|---|
| `www.viveport.com` | 34 | 🔴 Split required |
| `www.viverse.com` | 36 | 🔴 Split required |
| `avatar.viverse.com` | 1 | 🟢 Single CF Function |
| `market.viverse.com` | 4 | 🟢 Single CF Function |
| `stream.viverse.com` | 1 | 🟢 Single CF Function |

---

## Known Pain Points

### 1. CF Function ES5.1 Runtime
CF Functions run ES5.1 compliant runtime, but also support select ES6–ES9 features (`const`, `let`, arrow functions, spread, destructuring). Use `--target=es2019` — esbuild cannot transform `const`/spread to pure ES5 and CF Functions don't need it.

```bash
# Correct build command for Terraform consumption
esbuild viewer-request.ts \
  --bundle --minify --target=es2019 \
  --format=iife --global-name=handler \
  --outfile=dist/viewer-request.js
```

### 2. dist/ Must Be Committed in viverse-terraform
Terraform reads `dist/*.js` at plan time. **Always commit built files** in the viverse-terraform repo. CI cannot build them at apply time.

### 3. Header Format Differences
- CF Function: `request.headers['x-foo'] = { value: 'bar' }` (flat object)
- Lambda@Edge: `request.headers['x-foo'] = [{ key: 'X-Foo', value: 'bar' }]` (array)

The adapters handle this automatically. Always use the correct adapter:
- `import { defineViewerRequest } from '@viverse/cf-engine/adapters/cf-function'`
- `import { defineViewerRequest } from '@viverse/cf-engine/adapters/lambda-edge'`

### 4. package.json exports — `types` Must Come First
In package.json exports map, `types` condition must be declared before `import`/`require`, or esbuild will warn.

### 5. Akamai `redirectplus` Expression Destinations
`redirectplus` supports dynamic expressions like `https://{{builtin.AK_HOST}}{{builtin.AK_PATH}}`. These are Akamai-specific template variables. Translate manually to CF-compatible values (usually the destination is a static URL).

### 6. `userLocation` → countryIs
Akamai's `userLocation` criterion uses EDGESCAPE data. In CF, country data comes from the `CloudFront-Viewer-Country` request header (two-letter ISO code). The `countryIs` criterion reads this header — but **you must enable CloudFront to forward this header in the cache behavior**.

### 7. Image Manager — Akamai `imformat=chrome` means WebP
The `imformat` query param maps: `chrome`/`webp` → WebP, `avif` → AVIF, `ie`/`safari`/`generic` → JPEG. The `imageOptimize` behavior handles this automatically.

---

## Consumer Pattern (viverse-terraform)

Each CloudFront property in `viverse-terraform` should follow this structure:

```
projects/cloudfront-<property>/
  configs/
    viewer-request.ts     # cf-engine rules → CF Function
    viewer-response.ts    # cf-engine rules → CF Function  
    <group>-lambda.ts     # cf-engine rules → Lambda@Edge (if split needed)
  dist/
    viewer-request.js     # built + committed
    viewer-response.js    # built + committed
    <group>-lambda.js     # built + committed
  build.mjs               # esbuild script
  package.json
  tsconfig.json
  .npmrc
```

To build:
```bash
cd projects/cloudfront-<property>
npm install
node build.mjs
```

---

## Terraform Integration

### How Terraform Consumes the Built JS

CF Functions and Lambda@Edge are referenced as **local file paths** in Terraform. The built `dist/*.js` files must be committed to the repo — Terraform reads them at `plan` time and cannot invoke a build process.

### CF Function (viewer-request / viewer-response)

```hcl
resource "aws_cloudfront_function" "viewer_request" {
  name    = "cloudfront-${var.property}-viewer-request"
  runtime = "cloudfront-js-1.0"
  publish = true
  code    = file("${path.module}/dist/viewer-request.js")
}

resource "aws_cloudfront_distribution" "main" {
  default_cache_behavior {
    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.viewer_request.arn
    }
    function_association {
      event_type   = "viewer-response"
      function_arn = aws_cloudfront_function.viewer_response.arn
    }
  }
}
```

### Lambda@Edge (for split-required properties)

```hcl
resource "aws_lambda_function" "redirects" {
  filename         = "${path.module}/dist/redirects-lambda.zip"
  source_code_hash = filebase64sha256("${path.module}/dist/redirects-lambda.zip")
  function_name    = "cloudfront-${var.property}-redirects"
  role             = aws_iam_role.lambda_edge.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  publish          = true
}

resource "aws_cloudfront_distribution" "main" {
  # Bind Lambda@Edge to a specific path pattern behavior
  ordered_cache_behavior {
    path_pattern = "/mkt/*"
    lambda_function_association {
      event_type   = "viewer-request"
      lambda_arn   = aws_lambda_function.redirects.qualified_arn
      include_body = false
    }
  }
}
```

### Lambda@Edge — Zip Packaging

Lambda@Edge requires a zip file (not raw JS). The `build.mjs` in each consumer project must also zip Lambda outputs:

```js
// build.mjs excerpt
import { execSync } from 'child_process'
import { createWriteStream } from 'fs'
import archiver from 'archiver'

// Build first
execSync('esbuild configs/redirects-lambda.ts --bundle --platform=node --target=node20 --format=cjs --outfile=dist/redirects-lambda.js')

// Then zip
const output = createWriteStream('dist/redirects-lambda.zip')
const archive = archiver('zip')
archive.pipe(output)
archive.file('dist/redirects-lambda.js', { name: 'index.js' })
await archive.finalize()
```

### Why dist/ Must Be Committed

Terraform runs `terraform plan` during CI/CD **without** a build step. It uses `file()` and `filebase64sha256()` to read and hash the JS/zip at plan time. If `dist/` is gitignored, the plan will fail with "no such file".

**Always run `node build.mjs` and commit `dist/` changes before applying Terraform.**

---

## Migration Tooling

The Akamai → CloudFront migration skill (CLI scripts + workflow) lives in **viverse-terraform**:

```
viverse-terraform/.agents/skills/akamai-migration/
  SKILL.md              # Step-by-step migration workflow
  analyze-akamai.ts     # CLI: analyze Akamai JSON → report + split recommendation
  generate-rules.ts     # CLI: Akamai JSON → cf-engine TypeScript draft
```

To use from viverse-terraform root:
```bash
npx ts-node .agents/skills/akamai-migration/analyze-akamai.ts path/to/property.json
npx ts-node .agents/skills/akamai-migration/generate-rules.ts path/to/property.json --out configs/
```
