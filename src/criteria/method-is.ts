import type { CriteriaFn } from '../core/types.js'

/**
 * Returns true if the HTTP request method matches any of the given methods.
 *
 * Comparison is case-insensitive — `'get'`, `'GET'`, and `'Get'` all match.
 *
 * Akamai equivalent: `requestMethod` criterion.
 *
 * @param methods - Array of HTTP method strings to match against (e.g. `['GET', 'POST']`).
 * @returns A `CriteriaFn` that evaluates to `true` when the request method matches any entry.
 *
 * @example
 * ```typescript
 * import { rule } from '@viverse/cf-engine'
 * import { methodIs } from '@viverse/cf-engine/criteria'
 * import { constructResponse } from '@viverse/cf-engine/behaviors'
 *
 * // Respond immediately to OPTIONS preflight requests
 * rule(methodIs(['OPTIONS']), constructResponse({ statusCode: 200, body: '' }))
 *
 * // Block non-GET/HEAD requests
 * rule(methodIs(['POST', 'PUT', 'DELETE', 'PATCH']),
 *   constructResponse({ statusCode: 405, body: 'Method Not Allowed' }))
 * ```
 */
export function methodIs(methods: string[]): CriteriaFn {
  return (req) => {
    const method = req.method.toUpperCase()
    return methods.some(m => m.toUpperCase() === method)
  }
}
