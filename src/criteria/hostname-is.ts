import type { CriteriaFn } from '../core/types.js'

/** Returns true if the request host header matches any of the given hostnames (case-insensitive). */
export function hostnameIs(...hostnames: string[]): CriteriaFn {
  return (req) => {
    const host = req.headers['host']?.value?.toLowerCase()
    if (!host) return false
    return hostnames.some(h => h.toLowerCase() === host)
  }
}
