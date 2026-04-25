import { describe, it, expect } from 'vitest'
import { headerContains } from '../../src/criteria/header-contains.js'
import type { HttpRequest } from '../../src/core/types.js'

const req = (headers: Record<string, { value: string }>): HttpRequest => ({
  uri: '/', method: 'GET', protocol: 'https', querystring: {}, headers, clientIp: '1.1.1.1'
})

describe('headerContains', () => {
  it('returns true when header contains substring', () => {
    expect(headerContains('accept', ['json'])(req({ accept: { value: 'application/json' } }))).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(headerContains('accept', ['JSON'])(req({ accept: { value: 'application/json' } }))).toBe(true)
  })

  it('returns false when header does not contain substring', () => {
    expect(headerContains('accept', ['xml'])(req({ accept: { value: 'application/json' } }))).toBe(false)
  })

  it('returns false when header is absent', () => {
    expect(headerContains('accept', ['json'])(req({}))).toBe(false)
  })

  it('normalizes header name', () => {
    expect(headerContains('Accept', ['json'])(req({ accept: { value: 'application/json' } }))).toBe(true)
  })

  it('supports multiple substrings', () => {
    const fn = headerContains('accept', ['json', 'xml'])
    expect(fn(req({ accept: { value: 'text/xml' } }))).toBe(true)
    expect(fn(req({ accept: { value: 'text/plain' } }))).toBe(false)
  })
})
