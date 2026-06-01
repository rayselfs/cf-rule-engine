import { runRules } from '../core/rule.js'
import type { Rule } from '../core/types.js'
import { normalizeRequest, denormalizeRequest, denormalizeResponse } from './_normalize.js'

/**
 * Creates a CloudFront Function viewer-request handler where rules are resolved
 * asynchronously before each request — for example, loading redirect maps or
 * CIDR lists from CloudFront KeyValueStore at startup.
 *
 * The `setup` function receives the raw CF event and returns a `Rule[]`. It is
 * called once per invocation, so any async initialization (e.g. KVS reads)
 * should be cached outside the handler when possible.
 *
 * @param setup - Async factory that receives the CF event and returns the ordered rule list.
 * @returns An async CloudFront Function handler `async (event) => request | response`.
 *
 * @example
 * ```ts
 * import { rule } from '@rayselfs/cf-rule-engine'
 * import { kvsRedirect } from '@rayselfs/cf-rule-engine/behaviors/kvs'
 * import { defineViewerRequestAsync } from '@rayselfs/cf-rule-engine/adapters/viewer-request'
 *
 * export default defineViewerRequestAsync(async () => [
 *   await kvsRedirect(handle, 'redirects'),
 * ])
 * ```
 */
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
