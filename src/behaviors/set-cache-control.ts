import type { ResponseBehaviorFn, HttpRequest, HttpResponse } from '../core/types.js'

export function setCacheControl(value: string): ResponseBehaviorFn {
  return (_request: HttpRequest, response: HttpResponse): HttpResponse => {
    return Object.assign({}, response, {
      headers: Object.assign({}, response.headers, {
        'cache-control': { value },
      }),
    })
  }
}
