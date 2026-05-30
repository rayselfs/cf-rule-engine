import { describe, it, expect } from 'vitest'
import { inCidr, matchesAnyCidr, ipToInt } from '../../src/shared/cidr.js'

describe('cidr', () => {
  describe('inCidr', () => {
    it('returns true when ip falls within cidr range', () => {
      expect(inCidr('10.0.0.1', '10.0.0.0/8')).toBe(true)
    })

    it('returns false when ip falls outside cidr range', () => {
      expect(inCidr('192.168.1.1', '10.0.0.0/8')).toBe(false)
    })

    it('returns true for /32 exact match', () => {
      expect(inCidr('10.0.0.1', '10.0.0.1/32')).toBe(true)
    })

    it('returns false for /32 non-match', () => {
      expect(inCidr('10.0.0.2', '10.0.0.1/32')).toBe(false)
    })

    it('IPv6: returns true when ip falls within /48 range', () => {
      expect(inCidr('2001:db8:1::1', '2001:db8:1::/48')).toBe(true)
    })

    it('IPv6: returns false when ip falls outside /48 range', () => {
      expect(inCidr('2001:db8:2::1', '2001:db8:1::/48')).toBe(false)
    })

    it('IPv6: returns true for /128 exact match', () => {
      expect(inCidr('2001:db8::1', '2001:db8::1/128')).toBe(true)
    })

    it('IPv6: returns false for /128 non-match', () => {
      expect(inCidr('2001:db8::2', '2001:db8::1/128')).toBe(false)
    })

    it('IPv6: handles :: shorthand (loopback)', () => {
      expect(inCidr('::1', '::1/128')).toBe(true)
      expect(inCidr('::2', '::1/128')).toBe(false)
    })

    it('IPv6: handles /0 (matches everything)', () => {
      expect(inCidr('2001:db8::1', '::/0')).toBe(true)
      expect(inCidr('fe80::1', '::/0')).toBe(true)
    })

    it('IPv6: handles IPv4-mapped address', () => {
      expect(inCidr('::ffff:10.0.0.1', '::ffff:10.0.0.0/112')).toBe(true)
      expect(inCidr('::ffff:192.168.1.1', '::ffff:10.0.0.0/112')).toBe(false)
    })
  })

  describe('matchesAnyCidr', () => {
    it('returns true if ip matches any cidr range', () => {
      expect(matchesAnyCidr('10.0.0.1', ['10.0.0.0/8', '192.168.0.0/16'])).toBe(true)
    })

    it('returns false if ip matches no cidr ranges', () => {
      expect(matchesAnyCidr('8.8.8.8', ['10.0.0.0/8'])).toBe(false)
    })

    it('IPv6: returns true if IPv6 ip matches any cidr range', () => {
      expect(matchesAnyCidr('2001:db8::1', ['10.0.0.0/8', '2001:db8::/32'])).toBe(true)
    })

    it('IPv6: returns false if IPv6 ip matches no cidr ranges', () => {
      expect(matchesAnyCidr('fe80::1', ['2001:db8::/32'])).toBe(false)
    })
  })

  describe('ipToInt', () => {
    it('converts ip address to integer', () => {
      expect(ipToInt('10.0.0.1')).toBe(167772161)
      expect(ipToInt('192.168.1.1')).toBe(3232235777)
    })
  })
})

