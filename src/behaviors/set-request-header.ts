import type { BehaviorFn, HttpRequest } from '../core/types.js'

/** Sets a request header to the specified value. */
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
