import type { CriteriaFn } from '../core/types.js'
import { matchesAnyCidrV4 } from '../shared/cidr-ipv4.js'

/**
 * Returns true if the client IP address falls within any of the given IPv4 CIDR ranges.
 *
 * Lighter alternative to `ipCidr` for IPv4-only deployments — excludes the IPv6
 * parsing and expansion logic, reducing bundle size by ~1 KB.
 *
 * Use `ipCidr` when you need IPv6 support. Use `ipCidrV4` when all CIDRs are IPv4.
 *
 * @param cidrs - Array of IPv4 CIDR range strings (e.g. `['10.0.0.0/8', '203.0.113.0/24']`).
 * @returns A `CriteriaFn` that evaluates to `true` when the client IP is within any listed CIDR.
 *
 * @example
 * ```typescript
 * import { rule, not } from '@rayselfs/cf-rule-engine'
 * import { ipCidrV4 } from '@rayselfs/cf-rule-engine/criteria/ip-cidr-v4'
 * import { redirect } from '@rayselfs/cf-rule-engine/behaviors/redirect'
 *
 * // Block traffic not from internal IPv4 networks
 * rule(not(ipCidrV4(['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'])),
 *   redirect(302, 'https://www.example.com'))
 * ```
 */
export function ipCidrV4(cidrs: string[]): CriteriaFn {
  return (req) => matchesAnyCidrV4(req.clientIp, cidrs)
}
