import { runRules } from '../core/rule.js'
import type { Rule } from '../core/types.js'
import { normalizeRequest, denormalizeRequest, denormalizeResponse } from './_normalize.js'

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
 * import { defineViewerRequest } from '@rayselfs/cf-rule-engine/adapters/viewer-request'
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
