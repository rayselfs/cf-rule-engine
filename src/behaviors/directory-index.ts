import type { BehaviorFn, HttpRequest } from '../core/types.js'

/**
 * Handles directory index routing for static site hosting, applying three transformations:
 *
 * 1. **Directory request** (`/path/`) → rewrites URI to `/path/index.html` (or custom file).
 * 2. **Index file request** (`/path/index.html`) → 301 redirects to `/path/`.
 * 3. **Extensionless path** (`/path/about`) → 301 redirects to `/path/about/`.
 *
 * This mirrors the behavior of S3 static website hosting when accessed via CloudFront
 * without using an S3 website endpoint.
 *
 * @param indexFile - The index file name to append to directory URIs.
 *   Default: `'index.html'`.
 * @returns A `BehaviorFn` to use as the second argument to `rule()`.
 *
 * @example
 * ```ts
 * import { directoryIndex } from '@rayselfs/cf-rule-engine/behaviors'
 * import { rule } from '@rayselfs/cf-rule-engine'
 * import { defineViewerRequest } from '@rayselfs/cf-rule-engine/adapters/cf-function'
 *
 * export default defineViewerRequest([
 *   rule(directoryIndex()),
 * ])
 *
 * // With a custom index file
 * rule(directoryIndex('default.html'))
 * ```
 */
export function directoryIndex(indexFile?: string): BehaviorFn {
  const file = indexFile || 'index.html'
  return (request: HttpRequest) => {
    const uri = request.uri

    if (uri.endsWith('/')) {
      return { action: 'continue', request: Object.assign({}, request, { uri: uri + file }) }
    }

    if (uri.endsWith('/' + file)) {
      const dirUri = uri.slice(0, uri.length - file.length)
      return {
        action: 'respond',
        response: {
          statusCode: 301,
          statusDescription: 'Moved Permanently',
          headers: {
            location: { value: dirUri },
            'cache-control': { value: 'no-store' },
          },
        },
      }
    }

    // matches path segments with no file extension: e.g. /foo/bar but not /foo/bar.html
    if (/\/[^/.]+$/.test(uri)) {
      return {
        action: 'respond',
        response: {
          statusCode: 301,
          statusDescription: 'Moved Permanently',
          headers: {
            location: { value: uri + '/' },
            'cache-control': { value: 'no-store' },
          },
        },
      }
    }

    return { action: 'continue', request }
  }
}
