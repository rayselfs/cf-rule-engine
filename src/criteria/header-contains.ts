import type { CriteriaFn } from '../core/types.js'

/**
 * Returns true if the named request header is present and its value contains
 * any of the given substrings.
 *
 * Both the header name lookup and substring search are case-insensitive.
 * If the header is absent from the request, the criterion returns `false`.
 *
 * Akamai equivalent: `requestHeader` criterion with `CONTAINS` match type.
 *
 * @param headerName - The HTTP request header name to inspect (e.g. `'user-agent'`, `'accept'`).
 * @param substrings - Array of substrings to search for within the header value.
 * @returns A `CriteriaFn` that evaluates to `true` when the header value contains any listed substring.
 *
 * @example
 * ```typescript
 * import { rule } from '@viverse/cf-engine'
 * import { headerContains } from '@viverse/cf-engine/criteria'
 * import { redirect } from '@viverse/cf-engine/behaviors'
 *
 * // Redirect requests that accept WebP to an optimized image path
 * rule(headerContains('accept', ['image/webp']),
 *   redirect(302, '/images/optimized'))
 *
 * // Match requests from mobile browsers
 * rule(headerContains('user-agent', ['Mobile', 'Android', 'iPhone']),
 *   redirect(302, 'https://m.viverse.com'))
 * ```
 */
export function headerContains(headerName: string, substrings: string[]): CriteriaFn {
  return (req) => {
    const val = req.headers[headerName.toLowerCase()]?.value
    if (val === undefined) return false
    const lower = val.toLowerCase()
    return substrings.some(s => lower.includes(s.toLowerCase()))
  }
}
