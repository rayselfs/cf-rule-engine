import type { CriteriaFn } from '../core/types.js'

/** Returns true if the request method matches any of the given methods (case-insensitive). */
export function methodIs(methods: string[]): CriteriaFn {
  return (req) => {
    const method = req.method.toUpperCase()
    return methods.some(m => m.toUpperCase() === method)
  }
}
