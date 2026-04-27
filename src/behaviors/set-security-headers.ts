import type { ResponseBehaviorFn, HttpRequest, HttpResponse } from '../core/types.js'

export interface SecurityHeadersOptions {
  hsts?: string
  xFrameOptions?: string
  xContentTypeOptions?: string
}

export function setSecurityHeaders(options?: SecurityHeadersOptions): ResponseBehaviorFn {
  const hsts = options?.hsts ?? 'max-age=31536000; includeSubDomains'
  const xFrameOptions = options?.xFrameOptions ?? 'SAMEORIGIN'
  const xContentTypeOptions = options?.xContentTypeOptions ?? 'nosniff'

  return (_request: HttpRequest, response: HttpResponse): HttpResponse => {
    return {
      ...response,
      headers: {
        ...response.headers,
        'strict-transport-security': { value: hsts },
        'x-frame-options': { value: xFrameOptions },
        'x-content-type-options': { value: xContentTypeOptions },
      },
    }
  }
}
