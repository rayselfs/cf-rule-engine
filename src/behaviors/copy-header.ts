import type { BehaviorFn, HttpRequest } from '../core/types.js'

/** Copies the value of one header to another header. */
export function copyHeader(sourceHeader: string, targetHeader: string): BehaviorFn {
  return (request: HttpRequest) => {
    const sourceValue = request.headers[sourceHeader.toLowerCase()]?.value
    if (sourceValue === undefined) {
      return { action: 'continue', request }
    }
    return {
      action: 'continue',
      request: {
        ...request,
        headers: {
          ...request.headers,
          [targetHeader.toLowerCase()]: { value: sourceValue },
        },
      },
    }
  }
}
