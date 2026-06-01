import type { Rule } from '../core/types.js'
import { rule, all, not } from '../core/rule.js'
import { ipCidr } from '../criteria/ip-cidr.js'
import { userAgentMatches } from '../criteria/user-agent-matches.js'
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
export function whitelist(options: WhitelistOptions): Rule {
  const userAgents = options.userAgents ?? []
  const bypassPaths = options.bypassPaths ?? []

  const criteria = [not(ipCidr(options.cidrs)), not(userAgentMatches(userAgents))]

  if (bypassPaths.length > 0) {
    criteria.push(not(pathMatches(bypassPaths)))
  }

  return rule(all(criteria), redirect(302, options.redirectUrl))
}
