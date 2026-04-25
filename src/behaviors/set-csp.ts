import type { ResponseBehaviorFn, HttpRequest, HttpResponse } from '../core/types.js'

export interface CspOptions {
  directives: Record<string, string>
}

export function setCsp(options: CspOptions): ResponseBehaviorFn {
  const cspValue = Object.entries(options.directives)
    .map(([directive, value]) => `${directive} ${value}`)
    .join('; ')

  return (_request: HttpRequest, response: HttpResponse): HttpResponse => {
    return {
      ...response,
      headers: {
        ...response.headers,
        'content-security-policy': { value: cspValue },
      },
    }
  }
}
