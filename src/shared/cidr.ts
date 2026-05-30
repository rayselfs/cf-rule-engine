/** Convert IPv4 string to unsigned 32-bit integer */
export function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0)
}

/** Returns true if the string looks like an IPv6 address */
function isIPv6(ip: string): boolean {
  return ip.indexOf(':') !== -1
}

/**
 * Expand an IPv6 address (including IPv4-mapped ::ffff:a.b.c.d) to an array of
 * 8 unsigned 16-bit integers. Returns null if the input is not a valid IPv6 address.
 */
function expandIPv6Groups(ip: string): number[] | null {
  // Handle IPv4-mapped IPv6: ::ffff:192.0.2.1
  if (ip.indexOf('.') !== -1) {
    const lastColon = ip.lastIndexOf(':')
    const ipv4Part = ip.slice(lastColon + 1)
    const octs = ipv4Part.split('.')
    if (octs.length !== 4) return null
    const hi = ((parseInt(octs[0], 10) << 8) | parseInt(octs[1], 10)) & 0xffff
    const lo = ((parseInt(octs[2], 10) << 8) | parseInt(octs[3], 10)) & 0xffff
    ip = ip.slice(0, lastColon + 1) + hi.toString(16) + ':' + lo.toString(16)
  }

  const halves = ip.split('::')
  if (halves.length > 2) return null

  const left: string[] = halves[0] ? halves[0].split(':') : []
  const right: string[] = halves.length === 2 && halves[1] ? halves[1].split(':') : []

  if (halves.length === 1 && left.length !== 8) return null

  const fill = 8 - left.length - right.length
  if (fill < 0) return null

  const groups: number[] = []
  for (let i = 0; i < left.length; i++) {
    groups.push(parseInt(left[i] || '0', 16) & 0xffff)
  }
  for (let j = 0; j < fill; j++) {
    groups.push(0)
  }
  for (let k = 0; k < right.length; k++) {
    groups.push(parseInt(right[k] || '0', 16) & 0xffff)
  }

  return groups.length === 8 ? groups : null
}

/** Returns true if IPv6 `ip` falls within the IPv6 `cidr` range */
function inCidrIPv6(ip: string, cidr: string): boolean {
  const slashIdx = cidr.indexOf('/')
  const range = slashIdx === -1 ? cidr : cidr.slice(0, slashIdx)
  const prefixLen = slashIdx === -1 ? 128 : parseInt(cidr.slice(slashIdx + 1), 10)

  const ipGroups = expandIPv6Groups(ip)
  const rangeGroups = expandIPv6Groups(range)
  if (!ipGroups || !rangeGroups) return false

  const fullGroups = Math.floor(prefixLen / 16)
  const remainBits = prefixLen % 16

  for (let i = 0; i < fullGroups; i++) {
    if (ipGroups[i] !== rangeGroups[i]) return false
  }

  if (remainBits > 0 && fullGroups < 8) {
    const mask = (~0 << (16 - remainBits)) & 0xffff
    if ((ipGroups[fullGroups] & mask) !== (rangeGroups[fullGroups] & mask)) return false
  }

  return true
}

/** Returns true if `ip` falls within the `cidr` range. Supports IPv4 and IPv6. */
export function inCidr(ip: string, cidr: string): boolean {
  if (isIPv6(ip) || isIPv6(cidr)) return inCidrIPv6(ip, cidr)
  const parts = cidr.split('/')
  const range = parts[0]
  const bits = parts[1] || '32'
  const mask = bits === '0' ? 0 : (~0 << (32 - parseInt(bits, 10))) >>> 0
  return (ipToInt(ip) & mask) === (ipToInt(range) & mask)
}

/** Returns true if `ip` matches ANY of the given CIDR ranges. Supports IPv4 and IPv6. */
export function matchesAnyCidr(ip: string, cidrs: string[]): boolean {
  return cidrs.some(cidr => inCidr(ip, cidr))
}
