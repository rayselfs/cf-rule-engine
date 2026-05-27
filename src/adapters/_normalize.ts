import type { HttpRequest, HttpResponse } from '../core/types.js'

export function normalizeRequest(event: unknown): HttpRequest {
  const ev = event as Record<string, unknown>
  const req = ev.request as Record<string, unknown>
  const viewer = ev.viewer as Record<string, unknown> | undefined
  const headers = (req.headers ?? {}) as Record<string, { value: string }>
  return {
    uri: req.uri as string,
    method: req.method as string,
    protocol: 'https',
    querystring: (req.querystring ?? {}) as Record<string, { value: string }>,
    headers,
    clientIp: (viewer?.ip as string) ?? '',
    country: headers['cloudfront-viewer-country']?.value,
  }
}

export function denormalizeRequest(req: HttpRequest, cookies: unknown): unknown {
  return {
    method: req.method,
    uri: req.uri,
    querystring: req.querystring,
    headers: req.headers,
    cookies,
  }
}

export function denormalizeResponse(res: HttpResponse): unknown {
  return {
    statusCode: res.statusCode,
    statusDescription: res.statusDescription,
    headers: res.headers,
    body: res.body ?? '',
  }
}
