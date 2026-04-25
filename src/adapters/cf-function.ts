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

/**
 * Creates a CloudFront Function viewer-request handler from an ordered list of rules.
 *
 * The returned function is the CloudFront Function entry point. Assign it as
 * `export default` or `var handler` depending on your runtime configuration.
 *
 * Rules are evaluated in order. Processing stops at the first rule whose behavior
 * returns a response (e.g. `redirect`, `constructResponse`). If all rules continue,
 * the (possibly mutated) request is forwarded to the origin.
 *
 * @param rules - Ordered array of `Rule` objects created with `rule()`.
 * @returns A CloudFront Function handler `(event) => request | response`.
 *
 * @example
 * ```ts
 * import { rule, not } from '@rayselfs/cf-rule-engine'
 * import { ipCidr, pathPrefix } from '@rayselfs/cf-rule-engine/criteria'
 * import { redirect, setRequestHeader } from '@rayselfs/cf-rule-engine/behaviors'
 * import { defineViewerRequest } from '@rayselfs/cf-rule-engine/adapters/cf-function'
 *
 * export default defineViewerRequest([
 *   rule(not(ipCidr(['10.0.0.0/8'])), redirect(302, 'https://www.example.com')),
 *   rule(pathPrefix(['/api/']), setRequestHeader('x-forwarded-host', 'api.internal')),
 * ])
 * ```
 */
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

/**
 * Creates a CloudFront Function viewer-response handler from an ordered list of
 * response behaviors or response rules.
 *
 * Each entry can be either:
 * - A bare `ResponseBehaviorFn` — runs unconditionally on every response.
 * - A `ResponseRule` `{ criteria, behavior }` — runs only when `criteria` returns `true`
 *   for the current request.
 *
 * All behaviors are applied in order; none can short-circuit the response.
 * The final merged response object is returned to CloudFront.
 *
 * Note: If no behavior explicitly sets a body, the `body` field is omitted from
 * the returned response to avoid overwriting the origin's actual content.
 *
 * @param responseBehaviors - Ordered array of `ResponseBehaviorFn` functions or
 *   `ResponseRule` objects `{ criteria?, behavior }`.
 * @returns A CloudFront Function handler `(event) => response`.
 *
 * @example
 * ```ts
 * import { setSecurityHeaders, setCorsHeaders, setResponseHeader } from '@rayselfs/cf-rule-engine/behaviors'
 * import { pathPrefix } from '@rayselfs/cf-rule-engine/criteria'
 * import { defineViewerResponse } from '@rayselfs/cf-rule-engine/adapters/cf-function'
 *
 * export default defineViewerResponse([
 *   setSecurityHeaders(),
 *   setCorsHeaders({ allowedOrigins: ['https://www.example.com'] }),
 *   { criteria: pathPrefix(['/api/']), behavior: setResponseHeader('cache-control', 'no-store') },
 * ])
 * ```
 */
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
