import type { BehaviorFn, HttpRequest } from '../core/types.js'

export function stripQueryParams(...params: string[]): BehaviorFn {
  return (request: HttpRequest) => {
    const querystring = { ...request.querystring }
    for (const param of params) {
      delete querystring[param]
    }
    return { action: 'continue', request: { ...request, querystring } }
  }
}
