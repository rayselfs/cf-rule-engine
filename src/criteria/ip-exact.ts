import type { CriteriaFn } from '../core/types.js'

/**
 * Returns true if the client IP address exactly matches any of the given IPs.
 *
 * Lighter alternative to `ipCidr` when all entries are exact host addresses
 * (i.e. equivalent to `/32` in CIDR notation). Uses `Array.includes` — no CIDR
 * parsing, no IPv6 handling, no bit arithmetic.
 *
 * Use `ipCidr` when you need subnet ranges. Use `ipExact` when you only have
 * a list of exact IPs (e.g. office egress IPs, VPN endpoints).
 *
 * @param ips - Array of exact IPv4 or IPv6 addresses to match against.
 * @returns A `CriteriaFn` that evaluates to `true` when the client IP is in the list.
 *
 * @example
 * ```typescript
 * import { rule, not } from '@rayselfs/cf-rule-engine'
 * import { ipExact } from '@rayselfs/cf-rule-engine/criteria/ip-exact'
 * import { redirect } from '@rayselfs/cf-rule-engine/behaviors/redirect'
 *
 * // Allow only specific office IPs
 * rule(not(ipExact(['61.218.44.76', '122.147.213.24'])),
 *   redirect(302, 'https://www.example.com'))
 * ```
 */
export function ipExact(ips: string[]): CriteriaFn {
  return (req) => ips.includes(req.clientIp)
}
