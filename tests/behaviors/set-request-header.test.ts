import { describe, it, expect } from 'vitest'
import { setRequestHeader } from '../../src/behaviors/set-request-header.js'

const baseRequest = {
  uri: '/',
  method: 'GET',
  protocol: 'https',
  querystring: {},
  headers: {},
  clientIp: '1.2.3.4',
}

describe('setRequestHeader', () => {
  it('sets a header on the request', () => {
    const fn = setRequestHeader('X-Custom', 'hello')
    const result = fn(baseRequest)
    expect(result.action).toBe('continue')
    if (result.action === 'continue') {
      expect(result.request.headers['x-custom']).toEqual({ value: 'hello' })
    }
  })

  it('lowercases the header name', () => {
    const fn = setRequestHeader('X-UPPER', 'val')
    const result = fn(baseRequest)
    if (result.action === 'continue') {
      expect(result.request.headers['x-upper']).toEqual({ value: 'val' })
      expect(result.request.headers['X-UPPER']).toBeUndefined()
    }
  })

  it('overwrites existing header', () => {
    const req = { ...baseRequest, headers: { 'x-foo': { value: 'old' } } }
    const fn = setRequestHeader('X-Foo', 'new')
    const result = fn(req)
    if (result.action === 'continue') {
      expect(result.request.headers['x-foo'].value).toBe('new')
    }
  })

  it('does not mutate original request', () => {
    const fn = setRequestHeader('X-New', 'v')
    fn(baseRequest)
    expect(baseRequest.headers).toEqual({})
  })
})
