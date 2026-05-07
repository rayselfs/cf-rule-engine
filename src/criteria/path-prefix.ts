import type { CriteriaFn } from '../core/types.js'

/**
 * Returns `true` if the request URI starts with any of the given prefixes.
 *
 * Matching is case-sensitive and applied to the full URI including the leading `/`.
 * Commonly used to scope rules to a URL subtree (e.g. `/api/`, `/static/`).
 *
 * Akamai equivalent: `path` criterion with `STARTS_WITH` match type.
 *
 * @param prefixes - Array of URI prefixes to match (e.g. `['/api/', '/v2/']`).
 * @returns A `CriteriaFn` to use as the first argument to `rule()`.
 *
 * @example
 * ```ts
 * rule(pathPrefix(['/api/', '/v2/']), setRequestHeader('x-api', 'true'))
 * ```
 */
export function pathPrefix(prefixes: string[]): CriteriaFn {
  return (req) => prefixes.some(p => req.uri.startsWith(p))
}
