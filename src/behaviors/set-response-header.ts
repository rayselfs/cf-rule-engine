import type { ResponseBehaviorFn, HttpRequest, HttpResponse } from '../core/types.js'

export function setResponseHeader(headerName: string, value: string): ResponseBehaviorFn {
  return (_request: HttpRequest, response: HttpResponse): HttpResponse => {
    return {
      ...response,
      headers: {
        ...response.headers,
        [headerName.toLowerCase()]: { value },
      },
    }
  }
}
