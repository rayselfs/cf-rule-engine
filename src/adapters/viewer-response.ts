import type { ResponseBehaviorFn, ResponseRule, HttpResponse } from '../core/types.js'
import { normalizeRequest, denormalizeResponse } from './_normalize.js'

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
 * import { defineViewerResponse } from '@rayselfs/cf-rule-engine/adapters/viewer-response'
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
