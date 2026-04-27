import { describe, it, expect } from 'vitest'
import { redirect } from '../../src/behaviors/redirect.js'

const baseRequest = {
  uri: '/old',
  method: 'GET',
  protocol: 'https',
  querystring: {},
  headers: {},
  clientIp: '1.2.3.4',
}

describe('redirect', () => {
  it('returns 302 with location and no-store', () => {
    const fn = redirect(302, '/new')
    const result = fn(baseRequest)
    expect(result).toEqual({
      action: 'respond',
      response: {
        statusCode: 302,
        statusDescription: 'Found',
        headers: {
          location: { value: '/new' },
          'cache-control': { value: 'no-store' },
        },
      },
    })
  })

  it('returns 301 with Moved Permanently', () => {
    const fn = redirect(301, '/moved')
    const result = fn(baseRequest)
    expect(result.action).toBe('respond')
    if (result.action === 'respond') {
      expect(result.response.statusCode).toBe(301)
      expect(result.response.statusDescription).toBe('Moved Permanently')
    }
  })

  it('returns 307 with Temporary Redirect', () => {
    const fn = redirect(307, '/temp')
    const result = fn(baseRequest)
    if (result.action === 'respond') {
      expect(result.response.statusDescription).toBe('Temporary Redirect')
    }
  })

  it('preserves querystring when option is set', () => {
    const fn = redirect(302, '/new', { preserveQuerystring: true })
    const result = fn({ ...baseRequest, querystring: { foo: { value: 'bar' }, baz: { value: 'qux' } } })
    if (result.action === 'respond') {
      const loc = result.response.headers['location'].value
      expect(loc).toMatch('/new?')
      expect(loc).toContain('foo=bar')
      expect(loc).toContain('baz=qux')
    }
  })

  it('does not append querystring when empty and preserveQuerystring true', () => {
    const fn = redirect(302, '/new', { preserveQuerystring: true })
    const result = fn(baseRequest)
    if (result.action === 'respond') {
      expect(result.response.headers['location'].value).toBe('/new')
    }
  })
})
