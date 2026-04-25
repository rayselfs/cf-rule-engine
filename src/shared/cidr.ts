/** Convert IPv4 string to unsigned 32-bit integer */
export function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0)
}

/** Returns true if `ip` falls within the `cidr` range (e.g. "10.0.0.0/8") */
export function inCidr(ip: string, cidr: string): boolean {
  const parts = cidr.split('/')
  const range = parts[0]
  const bits = parts[1] || '32'
  const mask = bits === '0' ? 0 : (~0 << (32 - parseInt(bits, 10))) >>> 0
  return (ipToInt(ip) & mask) === (ipToInt(range) & mask)
}

/** Returns true if `ip` matches ANY of the given CIDR ranges */
export function matchesAnyCidr(ip: string, cidrs: string[]): boolean {
  return cidrs.some(cidr => inCidr(ip, cidr))
}
