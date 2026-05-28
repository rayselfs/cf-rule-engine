import type { CriteriaFn } from '../core/types.js'

/**
 * Returns true if the named request header is present and its value exactly matches
 * any of the given strings.
 *
 * Both the header name lookup and value comparison are case-insensitive.
 * If the header is absent from the request, the criterion returns `false`.
 *
 * Akamai equivalent: `requestHeader` criterion with `IS_ONE_OF` match type.
 *
 * @param headerName - The HTTP request header name to inspect (e.g. `'origin'`, `'x-forwarded-for'`).
 * @param values - Array of exact strings the header value must equal (e.g. `['https://example.com']`).
 * @returns A `CriteriaFn` that evaluates to `true` when the header value matches any entry.
 *
 * @example
 * ```typescript
 * import { rule } from '@rayselfs/cf-rule-engine'
 * import { headerEquals } from '@rayselfs/cf-rule-engine/criteria'
 * import { setCorsHeaders } from '@rayselfs/cf-rule-engine/behaviors'
 *
 * // Apply CORS headers only for requests from known origins
 * rule(
 *   headerEquals('origin', ['https://www.example.com', 'https://store.example.com']),
 *   setCorsHeaders({ allowedOrigins: ['*'], allowOriginEcho: true, allowCredentials: true }),
 * )
 * ```
 */
export function headerEquals(headerName: string, values: string[]): CriteriaFn {
  return (req) => {
    const val = req.headers[headerName.toLowerCase()]?.value
    if (val === undefined) return false
    return values.some(v => v.toLowerCase() === val.toLowerCase())
  }
}
