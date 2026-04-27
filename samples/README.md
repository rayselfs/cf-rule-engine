# Samples

Real-world usage examples for `@viverse/cf-engine`.

## CloudFront Functions

| File | Adapter | Description |
|---|---|---|
| `viewer-request.ts` | `cf-function` | Request routing — whitelist, redirects, rewrites, CORS preflight |
| `viewer-response.ts` | `cf-function` | Response CORS headers — domain-scoped and public asset rules |

## Lambda@Edge (viewer-request)

Lambda@Edge is required when the behavior needs Node.js APIs unavailable in CF Functions.

| File | Akamai Equivalent | Why Lambda@Edge |
|---|---|---|
| `lambda-verify-token.ts` | `verifyTokenAuthorization` | Needs `crypto` (HMAC-SHA256) |
| `lambda-image-optimize.ts` | `imageManager` + `imOverride` | Can run on either; Lambda for complex header forwarding |

## Build

**CF Function** (`--target=es2019`, `--format=iife`):
```bash
esbuild viewer-request.ts --bundle --minify --target=es2019 --format=iife --global-name=handler --outfile=dist/viewer-request.js
```

**Lambda@Edge** (`--platform=node`, `--format=cjs`):
```bash
esbuild lambda-verify-token.ts --bundle --minify --platform=node --target=node20 --format=cjs --outfile=dist/lambda-verify-token.js
```
