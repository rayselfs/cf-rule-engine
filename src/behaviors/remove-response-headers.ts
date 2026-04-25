import type { ResponseBehaviorFn, HttpRequest, HttpResponse } from '../core/types.js'

/**
 * Removes one or more headers from the outgoing response.
 *
 * Useful for stripping headers that reveal implementation details
 * (e.g. `server`, `x-powered-by`) or headers added by the origin that
 * should not be forwarded to the client.
 *
 * Header names are matched case-insensitively.
 *
 * @param headerNames - Array of response header names to remove.
 * @returns A `ResponseBehaviorFn` to use directly in `defineViewerResponse` or wrapped in a `ResponseRule`.
 *
 * @example
 * ```ts
 * import { removeResponseHeaders } from '@rayselfs/cf-rule-engine/behaviors'
 * import { defineViewerResponse } from '@rayselfs/cf-rule-engine/adapters/cf-function'
 *
 * export default defineViewerResponse([
 *   removeResponseHeaders(['server', 'x-powered-by', 'x-amzn-requestid']),
 * ])
 * ```
 */
export function removeResponseHeaders(headerNames: string[]): ResponseBehaviorFn {
  return (_request: HttpRequest, response: HttpResponse): HttpResponse => {
    const headers = Object.assign({}, response.headers)
    for (let i = 0; i < headerNames.length; i++) {
      delete headers[headerNames[i].toLowerCase()]
    }
    return Object.assign({}, response, { headers })
  }
}
