# Samples

This directory contains real-world examples of how to use `@viverse/cf-engine` to build CloudFront Functions.

## stream-stage

The `stream-stage/` directory shows a complete viewer-request and viewer-response handler pair for the `stream-stage.viverse.com` CloudFront distribution.

### viewer-request.ts

Demonstrates request-stage logic:

- **Rule 1**: Whitelist enforcement. Blocks non-whitelisted IPs unless they have a whitelisted user agent or are accessing bypass paths (static assets, APIs).
- **Rule 2**: Metrics endpoint blocking.
- **Rule 3**: Root path rewrite to `/console/landing`.
- **Rule 4**: CORS preflight handling (OPTIONS).
- **Rule 5**: CloudFront country header propagation.

Build:
```bash
esbuild viewer-request.ts --bundle --minify --target=es5 --platform=browser --format=iife --outfile=dist/viewer-request.js
```

### viewer-response.ts

Demonstrates response-stage logic:

- **Behavior 1**: Domain-scoped CORS for requests from `*.viverse.com` origins to `stream-stage.viverse.com`, echoing back the origin.
- **Behavior 2**: Public asset CORS. Allows `*` origin for specific asset paths that are meant to be publicly accessible.

Build:
```bash
esbuild viewer-response.ts --bundle --minify --target=es5 --platform=browser --format=iife --outfile=dist/viewer-response.js
```

## Usage in viverse-terraform

These samples assume the `@viverse/cf-engine` package is published to the Verdaccio registry. Once installed as a dependency in `viverse-terraform`, they can be imported and built using esbuild before deployment:

```typescript
import config from '../samples/stream-stage/viewer-request.ts'
// Then pass to CloudFront Function construct
```

## Note

Samples are not included in the package build. They're for reference and documentation only. Each example can be built independently to generate a minified CloudFront Function handler.
