import type { ResponseBehaviorFn, HttpRequest, HttpResponse } from '../core/types.js'

export function removeResponseHeaders(...headerNames: string[]): ResponseBehaviorFn {
  return (_request: HttpRequest, response: HttpResponse): HttpResponse => {
    const headers = { ...response.headers }
    for (const name of headerNames) {
      delete headers[name.toLowerCase()]
    }
    return { ...response, headers }
  }
}
