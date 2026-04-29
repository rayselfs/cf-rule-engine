import type { CriteriaFn } from '../core/types.js'

/** Returns true if the request URI starts with any of the given prefixes. */
export function pathPrefix(prefixes: string[]): CriteriaFn {
  return (req) => prefixes.some(p => req.uri.startsWith(p))
}
