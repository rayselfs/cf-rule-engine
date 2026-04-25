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
  it('sets default security headers', () => {
    const fn = setSecurityHeaders()
    const result = fn(baseRequest, baseResponse)
    expect(result.headers['strict-transport-security'].value).toBe('max-age=31536000; includeSubDomains')
    expect(result.headers['x-frame-options'].value).toBe('SAMEORIGIN')
    expect(result.headers['x-content-type-options'].value).toBe('nosniff')
  })

  it('respects custom options', () => {
    const fn = setSecurityHeaders({
      hsts: 'max-age=0',
      xFrameOptions: 'DENY',
      xContentTypeOptions: 'nosniff',
    })
    const result = fn(baseRequest, baseResponse)
    expect(result.headers['strict-transport-security'].value).toBe('max-age=0')
    expect(result.headers['x-frame-options'].value).toBe('DENY')
  })
})
