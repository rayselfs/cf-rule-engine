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
})
