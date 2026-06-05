import { describe, it, expect } from 'vitest'
import { setCsp } from '../../src/behaviors/set-csp.js'

const baseRequest = {
  uri: '/',
  method: 'GET',
  protocol: 'https',
  querystring: {},
  headers: {},
  clientIp: '1.2.3.4',
}

const baseResponse = { statusCode: 200, headers: {} }

describe('setCsp', () => {
  it('sets content-security-policy header from directives', () => {
    const fn = setCsp({ directives: { 'default-src': "'self'", 'img-src': '* data:' } })
    const result = fn(baseRequest, baseResponse)
    const csp = result.headers['content-security-policy'].value
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain('img-src * data:')
  })

  it('joins directives with semicolons', () => {
    const fn = setCsp({ directives: { 'script-src': "'none'" } })
    const result = fn(baseRequest, baseResponse)
    expect(result.headers['content-security-policy'].value).toBe("script-src 'none'")
  })

  it('emits boolean directive without value or trailing space', () => {
    const fn = setCsp({ directives: { 'upgrade-insecure-requests': true } })
    const result = fn(baseRequest, baseResponse)
    expect(result.headers['content-security-policy'].value).toBe('upgrade-insecure-requests')
  })

  it('emits block-all-mixed-content without value or trailing space', () => {
    const fn = setCsp({ directives: { 'block-all-mixed-content': true } })
    const result = fn(baseRequest, baseResponse)
    expect(result.headers['content-security-policy'].value).toBe('block-all-mixed-content')
  })

  it('mixes value directives and boolean directives correctly', () => {
    const fn = setCsp({
      directives: {
        'default-src': "'self'",
        'upgrade-insecure-requests': true,
        'frame-ancestors': 'https://*.viverse.com',
      },
    })
    const result = fn(baseRequest, baseResponse)
    const csp = result.headers['content-security-policy'].value
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain('frame-ancestors https://*.viverse.com')
    expect(csp).toMatch(/(^|; )upgrade-insecure-requests(;|$)/)
    expect(csp).not.toContain('upgrade-insecure-requests ')
  })
})
