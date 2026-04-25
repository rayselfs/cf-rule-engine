import type { BehaviorFn } from '../core/types.js'

/**
 * Options for constructing a synthetic HTTP response at the edge.
 */
export interface ConstructResponseOptions {
  /**
   * The HTTP status code for the response (e.g. `200`, `403`, `404`).
   */
  statusCode: number
  /**
   * Optional response body string. If omitted, an empty body is returned.
   */
  body?: string
  /**
   * Optional `Content-Type` header value (e.g. `'application/json'`, `'text/plain'`).
   * Omit to exclude the `Content-Type` header from the response.
   */
  contentType?: string
  /**
   * Additional response headers to include, as a plain key-value map.
   * Header names are automatically lowercased.
   *
   * @example `{ 'x-request-id': '123', 'retry-after': '60' }`
   */
  headers?: Record<string, string>
}

const statusDescriptions: Record<number, string> = {
  200: 'OK',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
}

/**
 * Constructs and returns a synthetic HTTP response directly from the edge,
 * without forwarding the request to the origin.
 *
 * The response always includes `Cache-Control: no-store`.
 *
 * Akamai equivalent: `constructResponse` behavior.
 *
 * @param options - The response configuration: status code, optional body, content type,
 *   and any additional headers.
 * @returns A `BehaviorFn` to use as the second argument to `rule()`.
 *
 * @example
 * ```ts
 * import { constructResponse } from '@rayselfs/cf-rule-engine/behaviors'
 * import { methodIs, pathPrefix } from '@rayselfs/cf-rule-engine/criteria'
 * import { rule } from '@rayselfs/cf-rule-engine'
 *
 * // Respond to OPTIONS preflight requests
 * rule(methodIs(['OPTIONS']), constructResponse({ statusCode: 200, body: '' }))
 *
 * // Block with 403 and JSON error body
 * rule(
 *   pathPrefix(['/admin/']),
 *   constructResponse({
 *     statusCode: 403,
 *     contentType: 'application/json',
 *     body: JSON.stringify({ error: 'Forbidden' }),
 *   }),
 * )
 * ```
 */
export function constructResponse(options: ConstructResponseOptions): BehaviorFn {
  return () => {
    const headers: Record<string, { value: string }> = {
      'cache-control': { value: 'no-store' },
    }
    if (options.contentType) {
      headers['content-type'] = { value: options.contentType }
    }
    if (options.headers) {
      const headerEntries = Object.entries(options.headers)
      for (let i = 0; i < headerEntries.length; i++) {
        const entry = headerEntries[i]
        headers[entry[0].toLowerCase()] = { value: entry[1] }
      }
    }
    return {
      action: 'respond',
      response: {
        statusCode: options.statusCode,
        statusDescription: statusDescriptions[options.statusCode],
        headers,
        body: options.body,
      },
    }
  }
}
