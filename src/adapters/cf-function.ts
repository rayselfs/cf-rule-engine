import { runRules } from '../core/rule.js'
import type { Rule, ResponseBehaviorFn, ResponseRule, HttpRequest, HttpResponse } from '../core/types.js'

function normalizeRequest(event: unknown): HttpRequest {
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

function denormalizeRequest(req: HttpRequest, cookies: unknown): unknown {
  return {
    method: req.method,
    uri: req.uri,
    querystring: req.querystring,
    headers: req.headers,
    cookies,
  }
}

function denormalizeResponse(res: HttpResponse): unknown {
  return {
    statusCode: res.statusCode,
    statusDescription: res.statusDescription,
    headers: res.headers,
    body: res.body ?? '',
  }
}

/** Creates a CloudFront Function viewer request handler that executes rules and returns a normalized response. */
export function defineViewerRequest(rules: Rule[]): (event: unknown) => unknown {
  return (event) => {
    const ev = event as Record<string, unknown>
    const evReq = ev.request as Record<string, unknown>
    const originalCookies = evReq.cookies ?? {}
    const req = normalizeRequest(event)
    const result = runRules(rules, req)
    if (result.action === 'respond') return denormalizeResponse(result.response)
    return denormalizeRequest(result.request, originalCookies)
  }
}

/** Creates a CloudFront Function viewer response handler that applies response behaviors and returns a normalized response. */
export function defineViewerResponse(responseBehaviors: Array<ResponseBehaviorFn | ResponseRule>): (event: unknown) => unknown {
  return (event) => {
    const ev = event as Record<string, unknown>
    const evRes = ev.response as Record<string, unknown> | undefined
    const req = normalizeRequest(event)
    let response: HttpResponse = {
      statusCode: (evRes?.statusCode as number) ?? 200,
      statusDescription: evRes?.statusDescription as string | undefined,
      headers: (evRes?.headers ?? {}) as Record<string, { value: string }>,
      body: evRes?.body as string | undefined,
    }
    for (let i = 0; i < responseBehaviors.length; i++) {
      const entry = responseBehaviors[i]
      if (typeof entry === 'function') {
        response = entry(req, response)
      } else if (!entry.criteria || entry.criteria(req)) {
        response = entry.behavior(req, response)
      }
    }
    const normalized = denormalizeResponse(response) as Record<string, unknown>
    // Do not include body in viewer-response unless a behavior explicitly set it.
    // An empty body would override the origin's actual response content.
    if (!response.body) {
      delete normalized.body
    }
    return Object.assign({}, evRes as object, normalized)
  }
}
