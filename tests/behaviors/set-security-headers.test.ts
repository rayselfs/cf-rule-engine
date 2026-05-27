import { describe, it, expect } from 'vitest'
import { setSecurityHeaders } from '../../src/behaviors/set-security-headers.js'

const baseRequest = {
  uri: '/',
  method: 'GET',
  protocol: 'https',
  querystring: {},
  headers: {},
  clientIp: '1.2.3.4',
}

const baseResponse = { statusCode: 200, headers: {} }

describe('setSecurityHeaders', () => {
  it('sets all four headers when all options are provided', () => {
    const fn = setSecurityHeaders({
      hsts: 'max-age=31536000; includeSubDomains',
      xFrameOptions: 'SAMEORIGIN',
      xContentTypeOptions: 'nosniff',
      xXssProtection: '1; mode=block',
    })
    const result = fn(baseRequest, baseResponse)
    expect(result.headers['strict-transport-security'].value).toBe('max-age=31536000; includeSubDomains')
    expect(result.headers['x-frame-options'].value).toBe('SAMEORIGIN')
    expect(result.headers['x-content-type-options'].value).toBe('nosniff')
    expect(result.headers['x-xss-protection'].value).toBe('1; mode=block')
  })

  it('emits only hsts when only hsts is provided', () => {
    const fn = setSecurityHeaders({ hsts: 'max-age=15768000; includeSubDomains' })
    const result = fn(baseRequest, baseResponse)
    expect(result.headers['strict-transport-security'].value).toBe('max-age=15768000; includeSubDomains')
    expect(result.headers['x-frame-options']).toBeUndefined()
    expect(result.headers['x-content-type-options']).toBeUndefined()
    expect(result.headers['x-xss-protection']).toBeUndefined()
  })

  it('emits only xFrameOptions when only xFrameOptions is provided', () => {
    const fn = setSecurityHeaders({ xFrameOptions: 'DENY' })
    const result = fn(baseRequest, baseResponse)
    expect(result.headers['x-frame-options'].value).toBe('DENY')
    expect(result.headers['strict-transport-security']).toBeUndefined()
    expect(result.headers['x-content-type-options']).toBeUndefined()
  })

  it('emits only xContentTypeOptions when only xContentTypeOptions is provided', () => {
    const fn = setSecurityHeaders({ xContentTypeOptions: 'nosniff' })
    const result = fn(baseRequest, baseResponse)
    expect(result.headers['x-content-type-options'].value).toBe('nosniff')
    expect(result.headers['strict-transport-security']).toBeUndefined()
    expect(result.headers['x-frame-options']).toBeUndefined()
  })

  it('emits only xXssProtection when only xXssProtection is provided', () => {
    const fn = setSecurityHeaders({ xXssProtection: '1; mode=block' })
    const result = fn(baseRequest, baseResponse)
    expect(result.headers['x-xss-protection'].value).toBe('1; mode=block')
    expect(result.headers['strict-transport-security']).toBeUndefined()
  })

  it('supports hsts with preload directive', () => {
    const fn = setSecurityHeaders({ hsts: 'max-age=63072000; includeSubDomains; preload' })
    const result = fn(baseRequest, baseResponse)
    expect(result.headers['strict-transport-security'].value).toBe('max-age=63072000; includeSubDomains; preload')
  })

  it('preserves existing response headers', () => {
    const response = { statusCode: 200, headers: { 'x-custom': { value: 'keep-me' } } }
    const fn = setSecurityHeaders({ hsts: 'max-age=31536000; includeSubDomains', xContentTypeOptions: 'nosniff' })
    const result = fn(baseRequest, response)
    expect(result.headers['x-custom'].value).toBe('keep-me')
    expect(result.headers['strict-transport-security'].value).toBe('max-age=31536000; includeSubDomains')
    expect(result.headers['x-content-type-options'].value).toBe('nosniff')
  })

  it('does not mutate the original response', () => {
    const response = { statusCode: 200, headers: { 'content-type': { value: 'text/html' } } }
    const fn = setSecurityHeaders({ hsts: 'max-age=31536000; includeSubDomains' })
    fn(baseRequest, response)
    expect((response.headers as Record<string, unknown>)['strict-transport-security']).toBeUndefined()
  })

  it('later call overwrites an existing security header', () => {
    const response = {
      statusCode: 200,
      headers: { 'x-frame-options': { value: 'SAMEORIGIN' } },
    }
    const fn = setSecurityHeaders({ xFrameOptions: 'DENY' })
    const result = fn(baseRequest, response)
    expect(result.headers['x-frame-options'].value).toBe('DENY')
  })
})
