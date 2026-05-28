import { runRules } from '../core/rule.js'
import type { Rule, ResponseBehaviorFn, ResponseRule, HttpRequest, HttpResponse } from '../core/types.js'

function normalizeHeaders(
  headers: Record<string, Array<{ key: string; value: string }>>,
): Record<string, { value: string }> {
  const result: Record<string, { value: string }> = {}
  const entries = Object.entries(headers ?? {})
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const key = entry[0]
    const arr = entry[1]
    if (arr.length > 0) result[key.toLowerCase()] = { value: arr[0].value }
  }
  return result
}

function denormalizeHeaders(
  headers: Record<string, { value: string }>,
): Record<string, Array<{ key: string; value: string }>> {
  const result: Record<string, Array<{ key: string; value: string }>> = {}
  const entries = Object.entries(headers)
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const key = entry[0]
    const value = entry[1].value
    result[key] = [{ key, value }]
  }
  return result
}

function parseQuerystring(qs: string): Record<string, { value: string }> {
  if (!qs) return {}
  return Object.fromEntries(
    qs.split('&').map(p => {
      const parts = p.split('=')
      const k = parts[0]
      const v = parts[1] || ''
      return [k, { value: v }]
    }),
  )
}

function serializeQuerystring(qs: Record<string, { value: string }>): string {
  const qsEntries = Object.entries(qs)
  const parts: string[] = []
  for (let i = 0; i < qsEntries.length; i++) {
    parts.push(qsEntries[i][0] + '=' + qsEntries[i][1].value)
  }
  return parts.join('&')
}

/**
 * Creates a Lambda@Edge viewer-request handler from an ordered list of rules.
 *
 * The returned async function is the Lambda handler entry point. Export it as
 * `export const handler` and set `handler = "index.handler"` in the Lambda config.
 *
 * Rules are evaluated in order. Processing stops at the first rule whose behavior
 * returns a response (e.g. `redirect`, `constructResponse`). If all rules continue,
 * the (possibly mutated) request is forwarded to the origin.
 *
 * Header format differences from CF Function are handled automatically by this adapter —
 * Lambda@Edge uses `[{ key, value }]` arrays; cf-engine uses `{ value }` flat objects.
 *
 * @param rules - Ordered array of `Rule` objects created with `rule()`.
 * @returns An async Lambda handler `async (event) => request | response`.
 *
 * @example
 * ```ts
 * import { rule } from '@rayselfs/cf-rule-engine'
 * import { verifyToken, stripQueryParams } from '@rayselfs/cf-rule-engine/behaviors'
 * import { defineViewerRequest } from '@rayselfs/cf-rule-engine/adapters/lambda-edge'
 *
 * export const handler = defineViewerRequest([
 *   rule(verifyToken({ key: process.env.EDGE_AUTH_KEY! })),
 *   rule(stripQueryParams(['hdnts'])),
 * ])
 * ```
 */
export function defineViewerRequest(rules: Rule[]): (event: unknown) => unknown {
  return async (event) => {
    const ev = event as Record<string, unknown>
    const records = ev.Records as Array<{ cf: Record<string, unknown> }>
    const cf = records[0].cf
    const lambdaReq = cf.request as Record<string, unknown>
    const req: HttpRequest = {
      uri: lambdaReq.uri as string,
      method: lambdaReq.method as string,
      protocol: 'https',
      querystring: parseQuerystring((lambdaReq.querystring as string) ?? ''),
      headers: normalizeHeaders(
        (lambdaReq.headers ?? {}) as Record<string, Array<{ key: string; value: string }>>,
      ),
      clientIp: (lambdaReq.clientIp as string) ?? '',
    }
    const result = runRules(rules, req)
    if (result.action === 'respond') {
      return {
        status: String(result.response.statusCode),
        statusDescription: result.response.statusDescription,
        headers: denormalizeHeaders(result.response.headers),
        body: result.response.body ?? '',
      }
    }
    return Object.assign({}, lambdaReq, {
      uri: result.request.uri,
      querystring: serializeQuerystring(result.request.querystring),
      headers: denormalizeHeaders(result.request.headers),
    })
  }
}

/**
 * Creates a Lambda@Edge viewer-response handler from an ordered list of
 * response behaviors or response rules.
 *
 * Each entry can be either:
 * - A bare `ResponseBehaviorFn` — runs unconditionally on every response.
 * - A `ResponseRule` `{ criteria, behavior }` — runs only when `criteria` returns `true`
 *   for the current request.
 *
 * Header format normalization (Lambda@Edge ↔ cf-engine) is handled automatically.
 *
 * @param responseBehaviors - Ordered array of `ResponseBehaviorFn` functions or
 *   `ResponseRule` objects `{ criteria?, behavior }`.
 * @returns An async Lambda handler `async (event) => response`.
 *
 * @example
 * ```ts
 * import { setSecurityHeaders, setCorsHeaders } from '@rayselfs/cf-rule-engine/behaviors'
 * import { defineViewerResponse } from '@rayselfs/cf-rule-engine/adapters/lambda-edge'
 *
 * export const handler = defineViewerResponse([
 *   setSecurityHeaders(),
 *   setCorsHeaders({ allowedOrigins: ['https://www.example.com'] }),
 * ])
 * ```
 */
export function defineViewerResponse(responseBehaviors: Array<ResponseBehaviorFn | ResponseRule>): (event: unknown) => unknown {
  return async (event) => {
    const ev = event as Record<string, unknown>
    const records = ev.Records as Array<{ cf: Record<string, unknown> }>
    const cf = records[0].cf
    const lambdaReq = cf.request as Record<string, unknown>
    const lambdaRes = cf.response as Record<string, unknown>
    const req: HttpRequest = {
      uri: lambdaReq.uri as string,
      method: lambdaReq.method as string,
      protocol: 'https',
      querystring: parseQuerystring((lambdaReq.querystring as string) ?? ''),
      headers: normalizeHeaders(
        (lambdaReq.headers ?? {}) as Record<string, Array<{ key: string; value: string }>>,
      ),
      clientIp: (lambdaReq.clientIp as string) ?? '',
    }
    let response: HttpResponse = {
      statusCode: parseInt(lambdaRes.status as string, 10),
      statusDescription: lambdaRes.statusDescription as string | undefined,
      headers: normalizeHeaders(
        (lambdaRes.headers ?? {}) as Record<string, Array<{ key: string; value: string }>>,
      ),
      body: lambdaRes.body as string | undefined,
    }
    for (let i = 0; i < responseBehaviors.length; i++) {
      const entry = responseBehaviors[i]
      if (typeof entry === 'function') {
        response = entry(req, response)
      } else if (!entry.criteria || entry.criteria(req)) {
        response = entry.behavior(req, response)
      }
    }
    return Object.assign({}, lambdaRes, {
      status: String(response.statusCode),
      statusDescription: response.statusDescription,
      headers: denormalizeHeaders(response.headers),
    })
  }
}
