import { runRules } from '../core/rule.js'
import type { Rule } from '../core/types.js'
import { normalizeRequest, denormalizeRequest, denormalizeResponse } from './_normalize.js'

export function defineViewerRequestAsync(
  setup: (event: unknown) => Promise<Rule[]>,
): (event: unknown) => Promise<unknown> {
  return async (event) => {
    const ev = event as Record<string, unknown>
    const evReq = ev.request as Record<string, unknown>
    const originalCookies = evReq.cookies ?? {}
    const req = normalizeRequest(event)
    const rules = await setup(event)
    const result = runRules(rules, req)
    if (result.action === 'respond') return denormalizeResponse(result.response)
    return denormalizeRequest(result.request, originalCookies)
  }
}
