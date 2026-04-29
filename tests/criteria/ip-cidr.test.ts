import { describe, it, expect } from 'vitest'
import { ipCidr } from '../../src/criteria/ip-cidr.js'
import type { HttpRequest } from '../../src/core/types.js'

const req = (clientIp: string): HttpRequest => ({
  uri: '/', method: 'GET', protocol: 'https', querystring: {}, headers: {}, clientIp
})

describe('ipCidr', () => {
  it('returns true for IP within CIDR', () => {
    expect(ipCidr(['10.0.0.0/8'])(req('10.0.0.1'))).toBe(true)
  })

  it('returns false for IP outside CIDR', () => {
    expect(ipCidr(['10.0.0.0/8'])(req('192.168.1.1'))).toBe(false)
  })

  it('supports multiple CIDRs', () => {
    const fn = ipCidr(['10.0.0.0/8', '172.16.0.0/12'])
    expect(fn(req('172.16.0.1'))).toBe(true)
    expect(fn(req('8.8.8.8'))).toBe(false)
  })

  it('matches exact host /32', () => {
    expect(ipCidr(['1.2.3.4/32'])(req('1.2.3.4'))).toBe(true)
    expect(ipCidr(['1.2.3.4/32'])(req('1.2.3.5'))).toBe(false)
  })
})
