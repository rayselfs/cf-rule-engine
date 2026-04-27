import type { CriteriaFn } from '../core/types.js'

/** Returns true if the given header matches any of the provided values (case-insensitive). */
export function headerEquals(headerName: string, ...values: string[]): CriteriaFn {
  return (req) => {
    const val = req.headers[headerName.toLowerCase()]?.value
    if (val === undefined) return false
    return values.some(v => v.toLowerCase() === val.toLowerCase())
  }
}
