import type { CriteriaFn } from '../core/types.js'
import { matchesAnyCidr } from '../shared/cidr.js'
import type { KvsHandle } from '../shared/kvs.js'

export async function kvsIpCidr(handle: KvsHandle, key: string): Promise<CriteriaFn> {
  const raw = await handle.get(key)
  const cidrs: string[] = raw ? (JSON.parse(raw) as string[]) : []
  return (request) => matchesAnyCidr(request.clientIp, cidrs)
}
