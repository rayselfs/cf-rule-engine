import { describe, it, expect } from 'vitest'
import { pathEquals } from '../../src/criteria/path-equals.js'
import type { HttpRequest } from '../../src/core/types.js'

const req = (uri: string): HttpRequest => ({
  uri, method: 'GET', protocol: 'https', querystring: {}, headers: {}, clientIp: '1.1.1.1'
})

describe('pathEquals', () => {
  it('returns true for exact match', () => {
    expect(pathEquals(['/about'])(req('/about'))).toBe(true)
  })

  it('returns false for partial match', () => {
    expect(pathEquals(['/about'])(req('/about/us'))).toBe(false)
  })

  it('returns false for no match', () => {
    expect(pathEquals(['/about'])(req('/home'))).toBe(false)
  })

  it('supports multiple paths', () => {
    const fn = pathEquals(['/about', '/contact'])
    expect(fn(req('/contact'))).toBe(true)
    expect(fn(req('/home'))).toBe(false)
  })

  it('is case-sensitive', () => {
    expect(pathEquals(['/About'])(req('/about'))).toBe(false)
  })
})
