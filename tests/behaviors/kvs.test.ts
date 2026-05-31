import { describe, it, expect } from 'vitest'
import { kvsRedirect } from '../../src/behaviors/kvs.js'
import type { HttpRequest } from '../../src/core/types.js'

const mockHandle = (data: Record<string, string>) => ({
  get: async (key: string) => data[key],
})

const req = (uri: string): HttpRequest => ({
  uri, method: 'GET', protocol: 'https', querystring: {}, headers: {}, clientIp: '1.2.3.4',
})

describe('kvsRedirect', () => {
  it('returns 301 redirect for a matched URI', async () => {
    const handle = mockHandle({ redirects: JSON.stringify({ '/old': '/new' }) })
    const behavior = await kvsRedirect(handle, 'redirects')
    const result = behavior(req('/old'))
    expect(result.action).toBe('respond')
    if (result.action === 'respond') {
      expect(result.response.statusCode).toBe(301)
      expect(result.response.headers.location.value).toBe('/new')
    }
  })

  it('returns continue for unmatched URI', async () => {
    const handle = mockHandle({ redirects: JSON.stringify({ '/old': '/new' }) })
    const behavior = await kvsRedirect(handle, 'redirects')
    const result = behavior(req('/other'))
    expect(result.action).toBe('continue')
  })

  it('uses custom statusCode', async () => {
    const handle = mockHandle({ r: JSON.stringify({ '/a': '/b' }) })
    const behavior = await kvsRedirect(handle, 'r', 302)
    const result = behavior(req('/a'))
    expect(result.action).toBe('respond')
    if (result.action === 'respond') {
      expect(result.response.statusCode).toBe(302)
      expect(result.response.statusDescription).toBe('Found')
    }
  })

  it('returns continue for all URIs when KVS key is missing', async () => {
    const handle = mockHandle({})
    const behavior = await kvsRedirect(handle, 'missing')
    expect(behavior(req('/any')).action).toBe('continue')
  })

  it('handles multiple entries in map', async () => {
    const map = { '/a': '/aa', '/b': '/bb', '/c': '/cc' }
    const handle = mockHandle({ redirects: JSON.stringify(map) })
    const behavior = await kvsRedirect(handle, 'redirects')
    const r1 = behavior(req('/b'))
    const r2 = behavior(req('/d'))
    expect(r1.action).toBe('respond')
    if (r1.action === 'respond') expect(r1.response.headers.location.value).toBe('/bb')
    expect(r2.action).toBe('continue')
  })
})
