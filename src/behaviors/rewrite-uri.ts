import type { BehaviorFn, HttpRequest } from '../core/types.js'

/**
 * Rewrite mode that controls how the URI is transformed:
 * - `'set'` — Replace the entire URI with the target value.
 * - `'replace'` — Replace all occurrences of `match` in the URI with `target`.
 * - `'prepend'` — Prepend `target` to the beginning of the URI.
 * - `'regex-replace'` — Replace all matches of the `match` regex pattern with `target`.
 */
export type RewriteMode = 'set' | 'replace' | 'prepend' | 'regex-replace'

/**
 * Rewrites the request URI before it is forwarded to the origin.
 *
 * Akamai equivalent: `rewriteUrl` behavior.
 *
 * @param mode - The rewrite strategy to apply (see `RewriteMode`).
 * @param target - The target value for the rewrite (new URI, replacement string, or prefix).
 * @param match - The substring or regex pattern to match against (required for `'replace'`
 *   and `'regex-replace'` modes; ignored for `'set'` and `'prepend'`).
 * @returns A `BehaviorFn` to use as the second argument to `rule()`.
 *
 * @example
 * ```ts
 * import { rewriteUri } from '@rayselfs/cf-rule-engine/behaviors'
 * import { pathPrefix } from '@rayselfs/cf-rule-engine/criteria'
 * import { rule } from '@rayselfs/cf-rule-engine'
 *
 * // Set: replace entire URI
 * rule(pathEquals(['/index.php']), rewriteUri('set', '/index.html'))
 *
 * // Prepend: add a path prefix
 * rule(pathPrefix(['/images/']), rewriteUri('prepend', '/v2'))
 *
 * // Replace: substitute a path segment
 * rule(pathPrefix(['/legacy/']), rewriteUri('replace', '/current/', '/legacy/'))
 *
 * // Regex-replace: pattern-based substitution
 * rule(pathMatches(['/posts/[0-9]*']), rewriteUri('regex-replace', '/articles/$1', '/posts/([0-9]+)'))
 * ```
 */
export function rewriteUri(mode: RewriteMode, target: string, match?: string): BehaviorFn {
  const re = (mode === 'regex-replace' && match !== undefined) ? new RegExp(match, 'g') : null
  return (request: HttpRequest) => {
    let uri = request.uri
    switch (mode) {
      case 'set':
        uri = target
        break
      case 'prepend':
        uri = target + uri
        break
      case 'replace':
        if (match !== undefined) {
          uri = uri.split(match).join(target)
        }
        break
      case 'regex-replace':
        if (re) {
          re.lastIndex = 0
          uri = uri.replace(re, target)
        }
        break
    }
    return { action: 'continue', request: Object.assign({}, request, { uri }) }
  }
}
