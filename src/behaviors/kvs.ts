import type { BehaviorFn, HttpRequest, BehaviorResult } from '../core/types.js'
import type { KvsHandle } from '../shared/kvs.js'

/**
 * Loads a redirect map from CloudFront KeyValueStore and returns a `BehaviorFn`
 * that performs 301/302 redirects based on exact URI matches.
 *
 * The KVS value at `key` must be a JSON-encoded `Record<string, string>` mapping
 * source URIs to destination URLs (e.g. `{ "/old": "https://example.com/new" }`).
 * Requests whose URI does not appear in the map are passed through unchanged.
 *
 * Intended for use with `defineViewerRequestAsync` — the KVS read happens once
 * at setup time and the resulting map is captured in the returned closure.
 *
 * @param handle - KVS handle (from `@aws-sdk/cloudfront-keyvaluestore` or equivalent).
 * @param key - The KVS key whose value is a JSON redirect map.
 * @param statusCode - HTTP redirect status code. Defaults to `301`.
 * @returns A `BehaviorFn` to pass to `rule()`.
 *
 * @example
 * ```ts
 * import { defineViewerRequestAsync } from '@rayselfs/cf-rule-engine/adapters/viewer-request'
 * import { rule } from '@rayselfs/cf-rule-engine'
 * import { kvsRedirect } from '@rayselfs/cf-rule-engine/behaviors/kvs'
 *
 * export default defineViewerRequestAsync(async (event) => {
 *   const handle = CloudFront.createKeyValueStore(event)
 *   return [rule(await kvsRedirect(handle, 'redirects'))]
 * })
 * ```
 */
export async function kvsRedirect(
  handle: KvsHandle,
  key: string,
  statusCode?: number,
): Promise<BehaviorFn> {
  const raw = await handle.get(key)
  const map: Record<string, string> = raw ? (JSON.parse(raw) as Record<string, string>) : {}
  const code = statusCode !== undefined ? statusCode : 301
  const desc = code === 302 ? 'Found' : 'Moved Permanently'
  return (request: HttpRequest): BehaviorResult => {
    const dest = map[request.uri]
    if (!dest) return { action: 'continue', request }
    return {
      action: 'respond',
      response: {
        statusCode: code,
        statusDescription: desc,
        headers: { location: { value: dest } },
      },
    }
  }
}
