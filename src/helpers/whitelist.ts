import type { Rule, CriteriaFn } from '../core/types.js'
import { rule, all, any, not } from '../core/rule.js'
import { ipCidr } from '../criteria/ip-cidr.js'
import { ipExact } from '../criteria/ip-exact.js'
import { userAgentMatches } from '../criteria/user-agent-matches.js'
import { uaContains } from '../criteria/user-agent-contains.js'
import { pathEquals } from '../criteria/path-equals.js'
import { pathPrefix } from '../criteria/path-prefix.js'
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
   * Exact IP addresses to allow. Lighter alternative to `cidrs` when all
   * entries are host addresses — uses `Array.includes` with no bit arithmetic.
   *
   * @example `['61.218.44.76', '122.147.213.24']`
   */
  ips?: string[]
  /**
   * User-Agent wildcard patterns to allow (supports `*` and `?`).
   * Requests matching any pattern are passed through regardless of IP.
   *
   * @example `['*InternalBot*', '*Prerender*']`
   */
  userAgents?: string[]
  /**
   * User-Agent substrings to allow. Lighter alternative to `userAgents` when
   * patterns are of the form `*keyword*` — uses `String.includes` with no
   * regex compilation.
   *
   * @example `['HTCVRSDET', 'Prerender', 'HTC3PARTY']`
   */
  uaKeywords?: string[]
  /**
   * URL to redirect blocked requests to. Redirects with HTTP 302.
   *
   * @example `'https://www.example.com'`
   */
  redirectUrl: string
  /**
   * URL path patterns that bypass the whitelist check entirely.
   * Supports exact paths and trailing-`/*` prefix patterns (e.g. `'/api/*'`).
   * For arbitrary wildcard patterns, use `bypassCriteria` instead.
   *
   * @example `['/api/health', '/public/*']`
   */
  bypassPaths?: string[]
  bypassCriteria?: CriteriaFn
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
    }
    // arbitrary wildcard patterns are not handled here; use options.bypassCriteria instead
  }

  const criteria: CriteriaFn[] = []
  if (exactPaths.length > 0) criteria.push(pathEquals(exactPaths))
  if (prefixPaths.length > 0) criteria.push(pathPrefix(prefixPaths))

  if (criteria.length === 1) return criteria[0]
  return any(criteria)
}

export function whitelist(options: WhitelistOptions): Rule {
  const userAgents = options.userAgents ?? []
  const ips = options.ips ?? []
  const uaKeywords = options.uaKeywords ?? []
  const bypassPaths = options.bypassPaths ?? []

  const ipAllow: CriteriaFn[] = []
  if (options.cidrs.length > 0) ipAllow.push(ipCidr(options.cidrs))
  if (ips.length > 0) ipAllow.push(ipExact(ips))

  const uaAllow: CriteriaFn[] = []
  if (userAgents.length > 0) uaAllow.push(userAgentMatches(userAgents))
  if (uaKeywords.length > 0) uaAllow.push(uaContains(uaKeywords))

  const blockIp: CriteriaFn = ipAllow.length === 0 ? () => true
    : ipAllow.length === 1 ? not(ipAllow[0]) : not(any(ipAllow))
  const blockUa: CriteriaFn = uaAllow.length === 0 ? () => true
    : uaAllow.length === 1 ? not(uaAllow[0]) : not(any(uaAllow))

  const criteria: CriteriaFn[] = [blockIp, blockUa]

  if (bypassPaths.length > 0) {
    criteria.push(not(buildBypassCriteria(bypassPaths)))
  }

  if (options.bypassCriteria !== undefined) {
    criteria.push(not(options.bypassCriteria))
  }

  return rule(all(criteria), redirect(302, options.redirectUrl))
}
