import { describe, it, expect } from 'vitest'
import { hostnameIs } from '../../src/criteria/hostname-is.js'
import type { HttpRequest } from '../../src/core/types.js'

const req = (host?: string): HttpRequest => ({
  uri: '/', method: 'GET', protocol: 'https', querystring: {},
  headers: host ? { host: { value: host } } : {},
  clientIp: '1.1.1.1'
})

describe('hostnameIs', () => {
  it('returns true for matching host', () => {
    expect(hostnameIs(['example.com'])(req('example.com'))).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(hostnameIs(['example.com'])(req('EXAMPLE.COM'))).toBe(true)
  })

  it('returns false for non-matching host', () => {
    expect(hostnameIs(['example.com'])(req('other.com'))).toBe(false)
  })

  it('returns false when host header is missing', () => {
    expect(hostnameIs(['example.com'])(req())).toBe(false)
  })

  it('supports multiple hostnames', () => {
    const fn = hostnameIs(['example.com', 'www.example.com'])
    expect(fn(req('www.example.com'))).toBe(true)
    expect(fn(req('other.com'))).toBe(false)
  })
})
