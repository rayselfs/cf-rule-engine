import type { Rule, CriteriaFn } from '../core/types.js'
import { rule, all, any, not } from '../core/rule.js'
import { ipCidr } from '../criteria/ip-cidr.js'
import { userAgentMatches } from '../criteria/user-agent-matches.js'
import { pathEquals } from '../criteria/path-equals.js'
import { pathPrefix } from '../criteria/path-prefix.js'
import { pathMatches } from '../criteria/path-matches.js'
import { redirect } from '../behaviors/redirect.js'

/**
 * Configuration options for the IP/User-Agent access whitelist.
 */
export type WhitelistOptions = {
  /**
   * CIDR ranges to allow (e.g. office IPs, VPN, stage VPCs).
   * At least one of `cidrs` or `userAgents` must be non-empty, otherwise
   * every request will be redirected.
   *
   * @example `['203.0.113.0/24', '10.0.0.0/8']`
   */
  cidrs: string[]
  /**
   * User-Agent wildcard patterns to allow (supports `*` and `?`).
   * Requests matching any pattern are passed through regardless of IP.
   *
   * @example `['*InternalBot*', '*Prerender*']`
   */
  userAgents?: string[]
  /**
   * URL to redirect blocked requests to. Redirects with HTTP 302.
   *
   * @example `'https://www.example.com'`
   */
  redirectUrl: string
  /**
   * URL path patterns that bypass the whitelist check entirely.
   * Supports wildcard patterns (`*`, `?`).
   *
   * @example `['/api/health', '/public/*']`
   */
  bypassPaths?: string[]
}

/**
 * Creates a `Rule` that restricts access by IP CIDR range and/or User-Agent
 * pattern. Any request that does not match an allowed CIDR or User-Agent
 * (and is not on a bypassed path) is redirected with HTTP 302 to
 * `options.redirectUrl`.
 *
 * No default allowlists are included — callers must supply all allowed
 * CIDRs and User-Agent patterns explicitly.
 *
 * @param options - Whitelist configuration.
 * @returns A `Rule` ready to pass as an element of `defineViewerRequest`.
 *
 * @example
 * ```ts
 * import { whitelist } from '@rayselfs/cf-rule-engine/helpers'
 * import { defineViewerRequest } from '@rayselfs/cf-rule-engine/adapters/cf-function'
 *
 * export default defineViewerRequest([
 *   whitelist({
 *     cidrs: ['203.0.113.0/24', '10.0.0.0/8'],
 *     userAgents: ['*InternalBot*'],
 *     redirectUrl: 'https://www.example.com',
 *   }),
 * ])
 *
 * // With bypass paths:
 * export default defineViewerRequest([
 *   whitelist({
 *     cidrs: ['203.0.113.0/24'],
 *     redirectUrl: 'https://www.example.com',
 *     bypassPaths: ['/api/health', '/robots.txt'],
 *   }),
 * ])
 * ```
 */
function buildBypassCriteria(paths: string[]): CriteriaFn {
  const exactPaths: string[] = []
  const prefixPaths: string[] = []
  const wildcardPatterns: string[] = []

  for (let i = 0; i < paths.length; i++) {
    const p = paths[i]
    const hasWildcard = p.indexOf('*') !== -1 || p.indexOf('?') !== -1
    const isTrailingSlashStar =
      p.charAt(p.length - 1) === '*' &&
      p.charAt(p.length - 2) === '/' &&
      p.indexOf('*') === p.length - 1 &&
      p.indexOf('?') === -1

    if (!hasWildcard) {
      exactPaths.push(p)
    } else if (isTrailingSlashStar) {
      prefixPaths.push(p.slice(0, p.length - 1))
    } else {
      wildcardPatterns.push(p)
    }
  }

  const criteria: CriteriaFn[] = []
  if (exactPaths.length > 0) criteria.push(pathEquals(exactPaths))
  if (prefixPaths.length > 0) criteria.push(pathPrefix(prefixPaths))
  if (wildcardPatterns.length > 0) criteria.push(pathMatches(wildcardPatterns))

  if (criteria.length === 1) return criteria[0]
  return any(criteria)
}

export function whitelist(options: WhitelistOptions): Rule {
  const userAgents = options.userAgents ?? []
  const bypassPaths = options.bypassPaths ?? []

  const criteria = [not(ipCidr(options.cidrs)), not(userAgentMatches(userAgents))]

  if (bypassPaths.length > 0) {
    criteria.push(not(buildBypassCriteria(bypassPaths)))
  }

  return rule(all(criteria), redirect(302, options.redirectUrl))
}
