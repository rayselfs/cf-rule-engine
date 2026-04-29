import type { BehaviorFn, HttpRequest } from '../core/types.js'

/** Options for configuring redirect behavior. */
export interface RedirectOptions {
  preserveQuerystring?: boolean
}

const statusDescriptions: Record<301 | 302 | 307, string> = {
  301: 'Moved Permanently',
  302: 'Found',
  307: 'Temporary Redirect',
}

/** Redirect the request. Preserves querystring if `options.preserveQuerystring` is true. */
export function redirect(
  statusCode: 301 | 302 | 307,
  location: string,
  options?: RedirectOptions,
): BehaviorFn {
  return (request: HttpRequest) => {
    let finalLocation = location
    if (options?.preserveQuerystring) {
      const qsEntries = Object.entries(request.querystring)
      const qsParts: string[] = []
      for (let i = 0; i < qsEntries.length; i++) {
        const entry = qsEntries[i]
        qsParts.push(entry[0] + '=' + entry[1].value)
      }
      const qs = qsParts.join('&')
      if (qs) {
        finalLocation = `${location}?${qs}`
      }
    }
    return {
      action: 'respond',
      response: {
        statusCode,
        statusDescription: statusDescriptions[statusCode],
        headers: {
          location: { value: finalLocation },
          'cache-control': { value: 'no-store' },
        },
      },
    }
  }
}
