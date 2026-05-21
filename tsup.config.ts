import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/core/types.ts',
    'src/core/rule.ts',
    // shared
    'src/shared/cidr.ts',
    'src/shared/wildcard.ts',
    // criteria
    'src/criteria/index.ts',
    'src/criteria/path-prefix.ts',
    'src/criteria/path-equals.ts',
    'src/criteria/path-matches.ts',
    'src/criteria/ip-cidr.ts',
    'src/criteria/hostname-is.ts',
    'src/criteria/method-is.ts',
    'src/criteria/header-equals.ts',
    'src/criteria/header-contains.ts',
    'src/criteria/file-extension.ts',
    'src/criteria/country-is.ts',
    'src/criteria/user-agent-matches.ts',
    // behaviors
    'src/behaviors/index.ts',
    'src/behaviors/redirect.ts',
    'src/behaviors/rewrite-uri.ts',
    'src/behaviors/construct-response.ts',
    'src/behaviors/directory-index.ts',
    'src/behaviors/set-request-header.ts',
    'src/behaviors/copy-header.ts',
    'src/behaviors/set-response-header.ts',
    'src/behaviors/remove-response-headers.ts',
    'src/behaviors/set-cors-headers.ts',
    'src/behaviors/strip-query-params.ts',
    'src/behaviors/set-csp.ts',
    'src/behaviors/set-cache-control.ts',
    'src/behaviors/set-security-headers.ts',
    'src/behaviors/image-optimize.ts',
    // adapters
    'src/adapters/cf-function.ts',
    'src/adapters/lambda-edge.ts',
    // helpers
    'src/helpers/index.ts',
    'src/helpers/send-country-code.ts',
    'src/helpers/viverse-whitelist.ts',
    'src/helpers/preflight-request.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: true,
  // CF JS 2.0 runtime does NOT support: for...of, Symbol.iterator, generators, async/await (viewer-request).
  // esbuild cannot downlevel for...of — avoid it in source code. Use index-based loops instead.
  target: 'es2020',
  outDir: 'dist',
})
