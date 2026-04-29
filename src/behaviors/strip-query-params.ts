import type { BehaviorFn, HttpRequest } from '../core/types.js'

export function stripQueryParams(params: string[]): BehaviorFn {
  return (request: HttpRequest) => {
    const querystring = Object.assign({}, request.querystring)
    for (let i = 0; i < params.length; i++) {
      delete querystring[params[i]]
    }
    return { action: 'continue', request: Object.assign({}, request, { querystring }) }
  }
}
