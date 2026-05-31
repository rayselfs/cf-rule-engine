import type { BehaviorFn, HttpRequest, BehaviorResult } from '../core/types.js'
import type { KvsHandle } from '../shared/kvs.js'

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
