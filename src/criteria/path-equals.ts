import type { CriteriaFn } from '../core/types.js'

/**
 * Returns `true` if the request URI is an exact match for any of the given paths.
 *
 * Matching is case-sensitive and compares the full URI (including leading `/`).
 * Query strings are **not** stripped before comparison — if your URI may include
 * query params, use `pathPrefix` or `pathMatches` instead.
 *
 * Akamai equivalent: `path` criterion with `MATCHES_ONE_OF` match type (exact).
 *
 * @param paths - Array of exact URI paths to match (e.g. `['/about', '/contact']`).
 * @returns A `CriteriaFn` to use as the first argument to `rule()`.
 *
 * @example
 * ```ts
 * rule(pathEquals(['/old-about', '/legacy-contact']), redirect(301, '/about'))
 * ```
 */
export function pathEquals(paths: string[]): CriteriaFn {
  return (req) => paths.some(p => req.uri === p)
}
