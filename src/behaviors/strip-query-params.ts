import type { BehaviorFn, HttpRequest } from '../core/types.js'

/**
 * Removes specific query string parameters from the request before it is forwarded to the origin.
 *
 * Commonly used after `verifyToken` to strip the auth token query param so it
 * is not exposed to the origin server.
 *
 * Parameters not present in the request are silently ignored.
 *
 * @param params - Array of query string parameter names to remove (case-sensitive).
 * @returns A `BehaviorFn` to use as the second argument to `rule()`.
 *
 * @example
 * ```ts
 * import { stripQueryParams, verifyToken } from '@rayselfs/cf-rule-engine/behaviors'
 * import { rule } from '@rayselfs/cf-rule-engine'
 *
 * rule(verifyToken({ key: process.env.EDGE_AUTH_KEY! })),
 * rule(stripQueryParams(['hdnts', 'imformat']))
 * ```
 */
export function stripQueryParams(params: string[]): BehaviorFn {
  return (request: HttpRequest) => {
    const querystring = Object.assign({}, request.querystring)
    for (let i = 0; i < params.length; i++) {
      delete querystring[params[i]]
    }
    return { action: 'continue', request: Object.assign({}, request, { querystring }) }
  }
}
