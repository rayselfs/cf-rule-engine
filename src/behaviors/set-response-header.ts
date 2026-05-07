import type { ResponseBehaviorFn, HttpRequest, HttpResponse } from '../core/types.js'

/**
 * Sets a response header to the specified value.
 *
 * Overwrites the header if it already exists. Header names are automatically
 * lowercased to match CloudFront's normalized format.
 *
 * Use inside `defineViewerResponse` to add or override outgoing response headers.
 *
 * @param headerName - The response header name to set (e.g. `'x-custom-header'`). Case-insensitive.
 * @param value - The value to assign to the header.
 * @returns A `ResponseBehaviorFn` to use directly in `defineViewerResponse` or wrapped in a `ResponseRule`.
 *
 * @example
 * ```ts
 * import { setResponseHeader } from '@viverse/cf-engine/behaviors'
 * import { defineViewerResponse } from '@viverse/cf-engine/adapters/cf-function'
 *
 * export default defineViewerResponse([
 *   setResponseHeader('x-powered-by', 'CloudFront'),
 *   setResponseHeader('x-custom-env', 'production'),
 * ])
 * ```
 */
export function setResponseHeader(headerName: string, value: string): ResponseBehaviorFn {
  return (_request: HttpRequest, response: HttpResponse): HttpResponse => {
    return Object.assign({}, response, {
      headers: Object.assign({}, response.headers, {
        [headerName.toLowerCase()]: { value },
      }),
    })
  }
}
