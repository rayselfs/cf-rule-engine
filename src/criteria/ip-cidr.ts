import type { CriteriaFn } from '../core/types.js'
import { matchesAnyCidr } from '../shared/cidr.js'

/** Returns true if the client IP matches any of the given CIDR ranges. */
export function ipCidr(cidrs: string[]): CriteriaFn {
  return (req) => matchesAnyCidr(req.clientIp, cidrs)
}
