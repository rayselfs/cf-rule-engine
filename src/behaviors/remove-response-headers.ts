import type { ResponseBehaviorFn, HttpRequest, HttpResponse } from '../core/types.js'

export function removeResponseHeaders(...headerNames: string[]): ResponseBehaviorFn {
  return (_request: HttpRequest, response: HttpResponse): HttpResponse => {
    const headers = { ...response.headers }
    for (let i = 0; i < headerNames.length; i++) {
      delete headers[headerNames[i].toLowerCase()]
    }
    return { ...response, headers }
  }
}
