import type { Rule } from '../core/types.js'
import { rule, all, not } from '../core/rule.js'
import { ipCidr } from '../criteria/ip-cidr.js'
import { userAgentMatches } from '../criteria/user-agent-matches.js'
import { pathMatches } from '../criteria/path-matches.js'
import { redirect } from '../behaviors/redirect.js'

const DEFAULT_CIDRS = [
  '61.218.44.76/32',
  '122.147.213.24/32',
  '60.251.61.121/32',
  '162.120.184.42/32',
  '175.98.157.254/32',
  '122.147.173.254/32',
  '52.33.9.56/32',
  '52.35.160.39/32',
  '50.112.203.191/32',
]

const DEFAULT_USER_AGENTS = ['*HTCVRSDET*', '*Prerender*', '*HTC3PARTY*']

/**
 * Configuration options for the VIVERSE internal access whitelist.
 */
export interface ViverseWhitelistOptions {
  /**
   * URL to redirect blocked requests to (e.g. `'https://www.viverse.com'`).
   * Redirects with HTTP 302.
   */
  redirectUrl: string
  /**
   * Additional CIDR ranges to allow beyond the default HTC internal list.
   * Merged with the built-in defaults (HTC offices, VPN, stage VPCs).
   *
   * @example `['198.51.100.0/24']`
   */
  additionalCidrs?: string[]
  /**
   * Additional User-Agent wildcard patterns to allow beyond the default list.
   * Merged with the built-in defaults (`*HTCVRSDET*`, `*Prerender*`, `*HTC3PARTY*`).
   * Supports `*` (any chars) and `?` (one char).
   *
   * @example `['*CustomBot*', '*InternalMonitor*']`
   */
  additionalUAs?: string[]
  /**
   * URL path patterns that bypass the whitelist check entirely.
   * Supports wildcard patterns (`*`, `?`).
   *
   * @example `['/api/health', '/public/*']`
   */
  bypassPaths?: string[]
}

/**
 * Creates a pre-configured `Rule` that enforces HTC internal IP and User-Agent
 * allowlists, intended for staging environments.
 *
 * Any request that does **not** match an allowed CIDR range or User-Agent pattern
 * (and is not on a bypassed path) is redirected with HTTP 302 to `options.redirectUrl`.
 *
 * **Default allowed CIDRs** (HTC internal):
 * - HTC offices: `61.218.44.76`, `122.147.213.24`, `60.251.61.121`, `162.120.184.42`
 * - VPN: `175.98.157.254`, `122.147.173.254`
 * - Stage VPCs: `52.33.9.56`, `52.35.160.39`, `50.112.203.191`
 *
 * **Default allowed User-Agents**: `*HTCVRSDET*`, `*Prerender*`, `*HTC3PARTY*`
 *
 * @param options - Whitelist configuration, including the required redirect URL.
 * @returns A `Rule` ready to pass as the first element of `defineViewerRequest`.
 *
 * @example
 * ```ts
 * import { viverseWhitelist } from '@viverse/cf-engine/helpers'
 * import { defineViewerRequest } from '@viverse/cf-engine/adapters/cf-function'
 *
 * export default defineViewerRequest([
 *   viverseWhitelist({ redirectUrl: 'https://www.viverse.com' }),
 * ])
 *
 * // With additional CIDRs and bypass paths:
 * export default defineViewerRequest([
 *   viverseWhitelist({
 *     redirectUrl: 'https://www.viverse.com',
 *     additionalCidrs: ['198.51.100.0/24'],
 *     additionalUAs: ['*PartnerBot*'],
 *     bypassPaths: ['/api/health', '/robots.txt'],
 *   }),
 * ])
 * ```
 */
export function viverseWhitelist(options: ViverseWhitelistOptions): Rule {
  const additionalCidrs = options.additionalCidrs ?? []
  const additionalUAs = options.additionalUAs ?? []
  const bypassPaths = options.bypassPaths ?? []

  const allCidrs = DEFAULT_CIDRS.concat(additionalCidrs)
  const allUAs = DEFAULT_USER_AGENTS.concat(additionalUAs)

  const criteria = [not(ipCidr(allCidrs)), not(userAgentMatches(allUAs))]

  if (bypassPaths.length > 0) {
    criteria.push(not(pathMatches(bypassPaths)))
  }

  return rule(all(criteria), redirect(302, options.redirectUrl))
}
