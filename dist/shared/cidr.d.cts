/** Convert IPv4 string to unsigned 32-bit integer */
declare function ipToInt(ip: string): number;
/** Returns true if `ip` falls within the `cidr` range (e.g. "10.0.0.0/8") */
declare function inCidr(ip: string, cidr: string): boolean;
/** Returns true if `ip` matches ANY of the given CIDR ranges */
declare function matchesAnyCidr(ip: string, cidrs: string[]): boolean;

export { inCidr, ipToInt, matchesAnyCidr };
