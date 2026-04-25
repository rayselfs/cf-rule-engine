import type { CriteriaFn } from '../core/types.js'

/**
 * Returns `true` if the request `Host` header matches any of the given hostnames.
 *
 * Comparison is case-insensitive. Port numbers in the `Host` header are included
 * in the comparison, so `'api.example.com:8080'` and `'api.example.com'` are
 * treated as different values.
 *
 * Akamai equivalent: `hostname` criterion.
 *
 * @param hostnames - Array of exact hostnames to match (e.g. `['www.example.com', 'example.com']`).
 * @returns A `CriteriaFn` to use as the first argument to `rule()`.
 *
 * @example
 * ```ts
 * rule(hostnameIs(['legacy.example.com']), redirect(301, 'https://www.example.com'))
 * ```
 */
export function hostnameIs(hostnames: string[]): CriteriaFn {
  return (req) => {
    const host = req.headers['host']?.value?.toLowerCase()
    if (!host) return false
    return hostnames.some(h => h.toLowerCase() === host)
  }
}
