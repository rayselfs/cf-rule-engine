import type { ResponseBehaviorFn, HttpRequest, HttpResponse } from '../core/types.js'

/**
 * Sets the `Cache-Control` response header to the specified value.
 *
 * Overwrites any existing `Cache-Control` header set by the origin.
 * Use this to enforce caching policies at the edge regardless of origin behavior.
 *
 * @param value - The `Cache-Control` directive string (e.g. `'public, max-age=31536000'`).
 * @returns A `ResponseBehaviorFn` to use directly in `defineViewerResponse` or wrapped in a `ResponseRule`.
 *
 * @example
 * ```ts
 * import { setCacheControl } from '@rayselfs/cf-rule-engine/behaviors'
 * import { pathPrefix } from '@rayselfs/cf-rule-engine/criteria'
 * import { rule } from '@rayselfs/cf-rule-engine'
 * import { defineViewerResponse } from '@rayselfs/cf-rule-engine/adapters/cf-function'
 *
 * export default defineViewerResponse([
 *   // Cache static assets for 1 year
 *   { criteria: pathPrefix(['/static/']), behavior: setCacheControl('public, max-age=31536000, immutable') },
 *   // Never cache API responses
 *   { criteria: pathPrefix(['/api/']), behavior: setCacheControl('no-store') },
 * ])
 * ```
 */
export function setCacheControl(value: string): ResponseBehaviorFn {
  return (_request: HttpRequest, response: HttpResponse): HttpResponse => {
    return Object.assign({}, response, {
      headers: Object.assign({}, response.headers, {
        'cache-control': { value },
      }),
    })
  }
}
