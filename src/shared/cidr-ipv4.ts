/** Convert IPv4 string to unsigned 32-bit integer */
function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0)
}

/** Returns true if IPv4 `ip` falls within the IPv4 `cidr` range */
function inCidrV4(ip: string, cidr: string): boolean {
  const parts = cidr.split('/')
  const range = parts[0]
  const bits = parts[1] || '32'
  const mask = bits === '0' ? 0 : (~0 << (32 - parseInt(bits, 10))) >>> 0
  return (ipToInt(ip) & mask) === (ipToInt(range) & mask)
}

/**
 * Returns true if `ip` matches ANY of the given IPv4 CIDR ranges.
 *
 * Lighter alternative to `matchesAnyCidr` from `shared/cidr` — supports IPv4 only.
 * Use when all CIDRs in the list are guaranteed to be IPv4.
 */
export function matchesAnyCidrV4(ip: string, cidrs: string[]): boolean {
  return cidrs.some(cidr => inCidrV4(ip, cidr))
}
