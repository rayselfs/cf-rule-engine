import type { ResponseBehaviorFn, HttpRequest, HttpResponse } from '../core/types.js'

/** CORS configuration options: allowed origins, methods, headers, credentials, and max age. */
export interface CorsOptions {
  allowedOrigins?: string[]
  allowOriginEcho?: boolean
  allowedMethods?: string
  allowedHeaders?: string
  allowCredentials?: boolean
  maxAge?: number
}

function matchesOriginPattern(origin: string, pattern: string): boolean {
  if (pattern === '*') return true
  if (!pattern.includes('*')) return origin === pattern
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
  return new RegExp(`^${escaped}$`).test(origin)
}

/** Sets CORS headers on the response with configurable origin matching, methods, and credentials. */
export function setCorsHeaders(options?: CorsOptions): ResponseBehaviorFn {
  const allowedOrigins = options?.allowedOrigins ?? ['*']
  const allowedMethods = options?.allowedMethods ?? 'GET, POST, OPTIONS'
  const allowedHeaders = options?.allowedHeaders ?? 'Content-Type, Cache-Control, Pragma, Range'

  return (request: HttpRequest, response: HttpResponse): HttpResponse => {
    let allowOrigin = allowedOrigins[0] ?? '*'

    if (options?.allowOriginEcho) {
      const originHeader = request.headers['origin']?.value
      if (originHeader && allowedOrigins.some((p) => matchesOriginPattern(originHeader, p))) {
        allowOrigin = originHeader
      }
    }

    const corsHeaders: Record<string, { value: string }> = {
      'access-control-allow-origin': { value: allowOrigin },
      'access-control-allow-methods': { value: allowedMethods },
      'access-control-allow-headers': { value: allowedHeaders },
    }

    if (options?.allowCredentials) {
      corsHeaders['access-control-allow-credentials'] = { value: 'true' }
    }

    if (options?.maxAge !== undefined) {
      corsHeaders['access-control-max-age'] = { value: String(options.maxAge) }
    }

    return {
      ...response,
      headers: { ...response.headers, ...corsHeaders },
    }
  }
}
