import type { BehaviorFn, HttpRequest } from '../core/types.js'

/** Sets a request header to the specified value. */
export function setRequestHeader(headerName: string, value: string): BehaviorFn {
  return (request: HttpRequest) => {
    return {
      action: 'continue',
      request: {
        ...request,
        headers: {
          ...request.headers,
          [headerName.toLowerCase()]: { value },
        },
      },
    }
  }
}
