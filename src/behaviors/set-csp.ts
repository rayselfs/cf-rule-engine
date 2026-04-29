import type { ResponseBehaviorFn, HttpRequest, HttpResponse } from '../core/types.js'

export interface CspOptions {
  directives: Record<string, string>
}

export function setCsp(options: CspOptions): ResponseBehaviorFn {
  const dirEntries = Object.entries(options.directives)
  const dirParts: string[] = []
  for (let i = 0; i < dirEntries.length; i++) {
    dirParts.push(dirEntries[i][0] + ' ' + dirEntries[i][1])
  }
  const cspValue = dirParts.join('; ')

  return (_request: HttpRequest, response: HttpResponse): HttpResponse => {
    return Object.assign({}, response, {
      headers: Object.assign({}, response.headers, {
        'content-security-policy': { value: cspValue },
      }),
    })
  }
}
