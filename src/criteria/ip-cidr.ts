import type { CriteriaFn } from '../core/types.js'
import { matchesAnyCidr } from '../shared/cidr.js'

/**
 * Returns true if the client IP address falls within any of the given CIDR ranges.
 *
 * Supports both IPv4 (e.g. `10.0.0.0/8`) and IPv6 (e.g. `2001:db8::/32`) CIDR notation.
 * Uses the `CloudFront-Viewer-Address` header (stripped of port) as the source IP.
 *
 * Akamai equivalent: `clientIp` criterion with CIDR matching.
 *
 * @param cidrs - Array of CIDR range strings to match against (e.g. `['10.0.0.0/8', '172.16.0.0/12']`).
 * @returns A `CriteriaFn` that evaluates to `true` when the client IP is within any listed CIDR.
 *
 * @example
 * ```typescript
 * import { rule, not } from '@viverse/cf-engine'
 * import { ipCidr } from '@viverse/cf-engine/criteria'
 * import { redirect, constructResponse } from '@viverse/cf-engine/behaviors'
 *
 * // Block traffic not originating from internal networks
 * rule(not(ipCidr(['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'])),
 *   redirect(302, 'https://www.viverse.com'))
 *
 * // Allow only specific office IPs
 * rule(not(ipCidr(['61.218.44.76/32', '122.147.213.24/32'])),
 *   constructResponse({ statusCode: 403, body: 'Forbidden' }))
 * ```
 */
export function ipCidr(cidrs: string[]): CriteriaFn {
  return (req) => matchesAnyCidr(req.clientIp, cidrs)
}
