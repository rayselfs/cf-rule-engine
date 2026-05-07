import type { BehaviorFn, HttpRequest } from '../core/types.js'

/**
 * Copies the value of one request header into another request header.
 *
 * If the source header does not exist in the request, the behavior is a no-op —
 * the request is passed through unchanged. Header names are matched and written
 * in lowercase.
 *
 * Commonly used to forward CloudFront-injected headers (e.g. `CloudFront-Viewer-Country`)
 * under a custom name that the origin server expects.
 *
 * @param sourceHeader - The request header to read from. Case-insensitive.
 * @param targetHeader - The request header to write to. Case-insensitive.
 * @returns A `BehaviorFn` to use as the second argument to `rule()`.
 *
 * @example
 * ```ts
 * import { copyHeader } from '@viverse/cf-engine/behaviors'
 * import { rule } from '@viverse/cf-engine'
 *
 * rule(copyHeader('cloudfront-viewer-country', 'x-htc-request-country-code'))
 * ```
 */
export function copyHeader(sourceHeader: string, targetHeader: string): BehaviorFn {
  return (request: HttpRequest) => {
    const sourceValue = request.headers[sourceHeader.toLowerCase()]?.value
    if (sourceValue === undefined) {
      return { action: 'continue', request }
    }
    return {
      action: 'continue',
      request: Object.assign({}, request, {
        headers: Object.assign({}, request.headers, {
          [targetHeader.toLowerCase()]: { value: sourceValue },
        }),
      }),
    }
  }
}
