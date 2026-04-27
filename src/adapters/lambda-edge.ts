import { runRules } from '../core/rule.js'
import type { Rule, ResponseBehaviorFn, ResponseRule, HttpRequest, HttpResponse } from '../core/types.js'

function normalizeHeaders(
  headers: Record<string, Array<{ key: string; value: string }>>,
): Record<string, { value: string }> {
  const result: Record<string, { value: string }> = {}
  for (const [key, arr] of Object.entries(headers ?? {})) {
    if (arr.length > 0) result[key.toLowerCase()] = { value: arr[0].value }
  }
  return result
}

function denormalizeHeaders(
  headers: Record<string, { value: string }>,
): Record<string, Array<{ key: string; value: string }>> {
  const result: Record<string, Array<{ key: string; value: string }>> = {}
  for (const [key, { value }] of Object.entries(headers)) {
    result[key] = [{ key, value }]
  }
  return result
}

function parseQuerystring(qs: string): Record<string, { value: string }> {
  if (!qs) return {}
  return Object.fromEntries(
    qs.split('&').map(p => {
      const [k, v = ''] = p.split('=')
      return [k, { value: v }]
    }),
  )
}

function serializeQuerystring(qs: Record<string, { value: string }>): string {
  return Object.entries(qs)
    .map(([k, { value }]) => `${k}=${value}`)
    .join('&')
}

/** Creates a Lambda@Edge viewer request handler that executes rules and returns a normalized CloudFront event response. */
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
    return {
      ...lambdaReq,
      uri: result.request.uri,
      querystring: serializeQuerystring(result.request.querystring),
      headers: denormalizeHeaders(result.request.headers),
    }
  }
}

/** Creates a Lambda@Edge viewer response handler that applies response behaviors and returns a normalized CloudFront event response. */
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
    for (const entry of responseBehaviors) {
      if (typeof entry === 'function') {
        response = entry(req, response)
      } else if (!entry.criteria || entry.criteria(req)) {
        response = entry.behavior(req, response)
      }
    }
    return {
      ...lambdaRes,
      status: String(response.statusCode),
      statusDescription: response.statusDescription,
      headers: denormalizeHeaders(response.headers),
    }
  }
}
