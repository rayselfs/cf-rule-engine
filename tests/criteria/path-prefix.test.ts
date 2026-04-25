import { describe, it, expect } from 'vitest'
import { pathPrefix } from '../../src/criteria/path-prefix.js'
import type { HttpRequest } from '../../src/core/types.js'

const req = (uri: string): HttpRequest => ({
  uri, method: 'GET', protocol: 'https', querystring: {}, headers: {}, clientIp: '1.1.1.1'
})

describe('pathPrefix', () => {
  it('returns true when uri starts with prefix', () => {
    expect(pathPrefix('/api')(req('/api/v1'))).toBe(true)
  })

  it('returns true for exact match', () => {
    expect(pathPrefix('/api')(req('/api'))).toBe(true)
  })

  it('returns false when uri does not start with prefix', () => {
    expect(pathPrefix('/api')(req('/other'))).toBe(false)
  })

  it('supports multiple prefixes', () => {
    const fn = pathPrefix('/api', '/admin')
    expect(fn(req('/admin/users'))).toBe(true)
    expect(fn(req('/public'))).toBe(false)
  })

  it('is case-sensitive', () => {
    expect(pathPrefix('/Api')(req('/api/v1'))).toBe(false)
  })
})
