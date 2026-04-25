import { describe, it, expect } from 'vitest'
import { userAgentMatches } from '../../src/criteria/user-agent-matches.js'
import type { HttpRequest } from '../../src/core/types.js'

const req = (ua?: string): HttpRequest => ({
  uri: '/', method: 'GET', protocol: 'https', querystring: {},
  headers: ua ? { 'user-agent': { value: ua } } : {},
  clientIp: '1.1.1.1'
})

describe('userAgentMatches', () => {
  it('matches wildcard pattern', () => {
    expect(userAgentMatches(['*bot*'])(req('Googlebot/2.1'))).toBe(true)
  })

  it('returns false when pattern does not match', () => {
    expect(userAgentMatches(['*bot*'])(req('Mozilla/5.0'))).toBe(false)
  })

  it('returns false when user-agent header is missing', () => {
    expect(userAgentMatches(['*bot*'])(req())).toBe(false)
  })

  it('supports multiple patterns', () => {
    const fn = userAgentMatches(['*Googlebot*', '*Bingbot*'])
    expect(fn(req('Bingbot/2.0'))).toBe(true)
    expect(fn(req('Mozilla/5.0'))).toBe(false)
  })

  it('matches exact string', () => {
    expect(userAgentMatches(['curl/7.0'])(req('curl/7.0'))).toBe(true)
  })
})
