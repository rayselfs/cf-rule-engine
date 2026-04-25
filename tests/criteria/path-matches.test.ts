import { describe, it, expect } from 'vitest'
import { pathMatches } from '../../src/criteria/path-matches.js'
import type { HttpRequest } from '../../src/core/types.js'

const req = (uri: string): HttpRequest => ({
  uri, method: 'GET', protocol: 'https', querystring: {}, headers: {}, clientIp: '1.1.1.1'
})

describe('pathMatches', () => {
  it('matches wildcard *', () => {
    expect(pathMatches('/api/*')(req('/api/users'))).toBe(true)
  })

  it('matches wildcard ?', () => {
    expect(pathMatches('/api/?')(req('/api/v'))).toBe(true)
  })

  it('returns false for no wildcard match', () => {
    expect(pathMatches('/api/*')(req('/other/users'))).toBe(false)
  })

  it('strips querystring before matching', () => {
    expect(pathMatches('/api/*')(req('/api/users?foo=bar'))).toBe(true)
  })

  it('supports multiple patterns', () => {
    const fn = pathMatches('/api/*', '/admin/*')
    expect(fn(req('/admin/settings'))).toBe(true)
    expect(fn(req('/public/page'))).toBe(false)
  })
})
