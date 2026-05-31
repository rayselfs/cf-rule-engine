import { describe, it, expect } from 'vitest'
import { defineViewerRequestAsync } from '../../src/adapters/viewer-request-async.js'
import { rule } from '../../src/core/rule.js'
import { redirect } from '../../src/behaviors/redirect.js'
import { pathEquals } from '../../src/criteria/path-equals.js'
import { kvsIpCidr } from '../../src/criteria/kvs.js'

const mockHandle = (data: Record<string, string>) => ({ get: async (key: string) => data[key] })

const makeCfRequestEvent = (uri = '/test', clientIp = '1.2.3.4') => ({
  version: '1.0',
  context: { eventType: 'viewer-request' },
  viewer: { ip: '1.2.3.4' },
  request: {
    method: 'GET',
    uri,
    headers: { host: { value: 'example.com' } },
    querystring: {},
    cookies: {},
  },
  viewer: { ip: clientIp },
})

describe('defineViewerRequestAsync', () => {
  it('returns redirect response when rule triggers', async () => {
    const handler = defineViewerRequestAsync(async () => [rule(redirect(302, '/new'))])
    const result = await handler(makeCfRequestEvent()) as Record<string, unknown>
    expect(result.statusCode).toBe(302)
    const headers = result.headers as Record<string, { value: string }>
    expect(headers.location.value).toBe('/new')
  })

  it('returns request pass-through when no rule matches', async () => {
    const handler = defineViewerRequestAsync(async () => [
      rule(pathEquals(['/no-match']), redirect(302, '/new')),
    ])
    const result = await handler(makeCfRequestEvent()) as Record<string, unknown>
    expect(result.uri).toBe('/test')
    expect(result.statusCode).toBeUndefined()
  })

  it('awaits async setup before running rules', async () => {
    let setupCalled = false
    const handler = defineViewerRequestAsync(async () => {
      await Promise.resolve()
      setupCalled = true
      return [rule(redirect(301, '/done'))]
    })
    await handler(makeCfRequestEvent())
    expect(setupCalled).toBe(true)
  })

  it('passes event to setup function', async () => {
    let receivedEvent: unknown
    const handler = defineViewerRequestAsync(async (event) => {
      receivedEvent = event
      return []
    })
    const event = makeCfRequestEvent()
    await handler(event)
    expect(receivedEvent).toBe(event)
  })

  it('integrates with kvsIpCidr to block matched IPs', async () => {
    const handle = mockHandle({ blocklist: JSON.stringify(['10.0.0.0/8']) })
    const handler = defineViewerRequestAsync(async () => {
      const criteria = await kvsIpCidr(handle, 'blocklist')
      return [rule(criteria, redirect(403, '/blocked'))]
    })
    const blocked = await handler(makeCfRequestEvent('/test', '10.0.0.5')) as Record<string, unknown>
    expect(blocked.statusCode).toBe(403)
    const allowed = await handler(makeCfRequestEvent('/test', '8.8.8.8')) as Record<string, unknown>
    expect(allowed.statusCode).toBeUndefined()
  })
})
