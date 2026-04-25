import type { CriteriaFn } from '../core/types.js'

/** Returns true if the given header contains any of the provided substrings (case-insensitive). */
export function headerContains(headerName: string, ...substrings: string[]): CriteriaFn {
  return (req) => {
    const val = req.headers[headerName.toLowerCase()]?.value
    if (val === undefined) return false
    const lower = val.toLowerCase()
    return substrings.some(s => lower.includes(s.toLowerCase()))
  }
}
