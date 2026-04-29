import { describe, it, expect } from 'vitest'
import { headerEquals } from '../../src/criteria/header-equals.js'
import type { HttpRequest } from '../../src/core/types.js'

const req = (headers: Record<string, { value: string }>): HttpRequest => ({
  uri: '/', method: 'GET', protocol: 'https', querystring: {}, headers, clientIp: '1.1.1.1'
})

describe('headerEquals', () => {
  it('returns true for matching header value', () => {
    expect(headerEquals('content-type', ['application/json'])(req({ 'content-type': { value: 'application/json' } }))).toBe(true)
  })

  it('is case-insensitive for values', () => {
    expect(headerEquals('content-type', ['Application/JSON'])(req({ 'content-type': { value: 'application/json' } }))).toBe(true)
  })

  it('normalizes header name to lowercase', () => {
    expect(headerEquals('Content-Type', ['application/json'])(req({ 'content-type': { value: 'application/json' } }))).toBe(true)
  })

  it('returns false for non-matching value', () => {
    expect(headerEquals('content-type', ['text/html'])(req({ 'content-type': { value: 'application/json' } }))).toBe(false)
  })

  it('returns false when header is absent', () => {
    expect(headerEquals('content-type', ['application/json'])(req({}))).toBe(false)
  })

  it('supports multiple values', () => {
    const fn = headerEquals('content-type', ['application/json', 'text/html'])
    expect(fn(req({ 'content-type': { value: 'text/html' } }))).toBe(true)
    expect(fn(req({ 'content-type': { value: 'image/png' } }))).toBe(false)
  })
})
