import type { CriteriaFn } from '../core/types.js'
import { matchesAnyCidr } from '../shared/cidr.js'
import type { KvsHandle } from '../shared/kvs.js'

/**
 * Loads a CIDR allowlist from CloudFront KeyValueStore and returns a `CriteriaFn`
 * that matches client IPs against the loaded ranges.
 *
 * The KVS value at `key` must be a JSON-encoded `string[]` of CIDR ranges
 * (e.g. `["10.0.0.0/8", "203.0.113.0/24"]`). If the key is absent or the value
 * is empty, no IPs will match.
 *
 * Intended for use with `defineViewerRequestAsync` — the KVS read happens once
 * at setup time.
 *
 * @param handle - KVS handle.
 * @param key - The KVS key whose value is a JSON CIDR array.
 * @returns A `CriteriaFn` to pass to `rule()`.
 *
 * @example
 * ```ts
 * import { defineViewerRequestAsync } from '@rayselfs/cf-rule-engine/adapters/viewer-request'
 * import { rule, not } from '@rayselfs/cf-rule-engine'
 * import { kvsIpCidr } from '@rayselfs/cf-rule-engine/criteria/kvs'
 * import { redirect } from '@rayselfs/cf-rule-engine/behaviors'
 *
 * export default defineViewerRequestAsync(async (event) => {
 *   const handle = CloudFront.createKeyValueStore(event)
 *   return [rule(not(await kvsIpCidr(handle, 'allowed-cidrs')), redirect(302, 'https://www.example.com'))]
 * })
 * ```
 */
export async function kvsIpCidr(handle: KvsHandle, key: string): Promise<CriteriaFn> {
  const raw = await handle.get(key)
  const cidrs: string[] = raw ? (JSON.parse(raw) as string[]) : []
  return (request) => matchesAnyCidr(request.clientIp, cidrs)
}
