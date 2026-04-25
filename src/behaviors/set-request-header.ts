import type { BehaviorFn, HttpRequest } from '../core/types.js'

/**
 * Sets a request header to the specified value before the request is forwarded to the origin.
 *
 * If the header already exists, it is overwritten. Header names are automatically lowercased
 * to match CloudFront's normalized internal format.
 *
 * Akamai equivalent: `modifyOutgoingRequestHeader` behavior with `action: 'SET'`.
 *
 * @param headerName - The request header name to set (e.g. `'x-forwarded-for'`). Case-insensitive.
 * @param value - The value to assign to the header.
 * @returns A `BehaviorFn` to use as the second argument to `rule()`.
 *
 * @example
 * ```ts
 * import { setRequestHeader } from '@rayselfs/cf-rule-engine/behaviors'
 * import { pathPrefix } from '@rayselfs/cf-rule-engine/criteria'
 * import { rule } from '@rayselfs/cf-rule-engine'
 *
 * rule(pathPrefix(['/api/']), setRequestHeader('x-internal-service', 'cf-edge'))
 * ```
 */
export function setRequestHeader(headerName: string, value: string): BehaviorFn {
  return (request: HttpRequest) => {
    return {
      action: 'continue',
      request: Object.assign({}, request, {
        headers: Object.assign({}, request.headers, {
          [headerName.toLowerCase()]: { value },
        }),
      }),
    }
  }
}
