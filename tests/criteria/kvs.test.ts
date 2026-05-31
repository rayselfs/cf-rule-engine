import { describe, it, expect } from 'vitest'
import { kvsIpCidr } from '../../src/criteria/kvs.js'
import type { HttpRequest } from '../../src/core/types.js'

const mockHandle = (data: Record<string, string>) => ({
  get: async (key: string) => data[key],
})

const req = (clientIp: string): HttpRequest => ({
  uri: '/', method: 'GET', protocol: 'https', querystring: {}, headers: {}, clientIp,
})

describe('kvsIpCidr', () => {
  it('returns true for IP within CIDR loaded from KVS', async () => {
    const handle = mockHandle({ blocklist: JSON.stringify(['10.0.0.0/8']) })
    const criteria = await kvsIpCidr(handle, 'blocklist')
    expect(criteria(req('10.0.0.1'))).toBe(true)
  })

  it('returns false for IP outside CIDR', async () => {
    const handle = mockHandle({ blocklist: JSON.stringify(['10.0.0.0/8']) })
    const criteria = await kvsIpCidr(handle, 'blocklist')
    expect(criteria(req('192.168.1.1'))).toBe(false)
  })

  it('supports multiple CIDRs in KVS value', async () => {
    const handle = mockHandle({ list: JSON.stringify(['10.0.0.0/8', '172.16.0.0/12']) })
    const criteria = await kvsIpCidr(handle, 'list')
    expect(criteria(req('172.16.0.1'))).toBe(true)
    expect(criteria(req('8.8.8.8'))).toBe(false)
  })

  it('returns false for all IPs when KVS key is missing', async () => {
    const handle = mockHandle({})
    const criteria = await kvsIpCidr(handle, 'missing')
    expect(criteria(req('10.0.0.1'))).toBe(false)
  })

  it('supports IPv6 CIDRs stored in KVS', async () => {
    const handle = mockHandle({ v6list: JSON.stringify(['2001:db8::/32']) })
    const criteria = await kvsIpCidr(handle, 'v6list')
    expect(criteria(req('2001:db8::1'))).toBe(true)
    expect(criteria(req('fe80::1'))).toBe(false)
  })
})
