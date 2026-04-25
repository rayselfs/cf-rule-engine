import { describe, it, expect } from 'vitest'
import { rewriteUri } from '../../src/behaviors/rewrite-uri.js'

const baseRequest = {
  uri: '/foo/bar',
  method: 'GET',
  protocol: 'https',
  querystring: {},
  headers: {},
  clientIp: '1.2.3.4',
}

describe('rewriteUri', () => {
  it('set mode replaces uri', () => {
    const fn = rewriteUri('set', '/new-path')
    const result = fn(baseRequest)
    expect(result).toEqual({ action: 'continue', request: { ...baseRequest, uri: '/new-path' } })
  })

  it('prepend mode prepends target', () => {
    const fn = rewriteUri('prepend', '/prefix')
    const result = fn(baseRequest)
    if (result.action === 'continue') {
      expect(result.request.uri).toBe('/prefix/foo/bar')
    }
  })

  it('replace mode replaces all occurrences of match', () => {
    const fn = rewriteUri('replace', 'baz', 'bar')
    const result = fn({ ...baseRequest, uri: '/bar/bar' })
    if (result.action === 'continue') {
      expect(result.request.uri).toBe('/baz/baz')
    }
  })

  it('regex-replace mode uses regex pattern', () => {
    const fn = rewriteUri('regex-replace', 'X', '\\d+')
    const result = fn({ ...baseRequest, uri: '/foo/123/456' })
    if (result.action === 'continue') {
      expect(result.request.uri).toBe('/foo/X/X')
    }
  })

  it('returns continue action', () => {
    const fn = rewriteUri('set', '/x')
    expect(fn(baseRequest).action).toBe('continue')
  })
})
