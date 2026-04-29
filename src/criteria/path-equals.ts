import type { CriteriaFn } from '../core/types.js'

/** Returns true if the request URI equals any of the given paths. */
export function pathEquals(paths: string[]): CriteriaFn {
  return (req) => paths.some(p => req.uri === p)
}
