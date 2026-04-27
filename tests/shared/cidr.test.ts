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
  })

  describe('matchesAnyCidr', () => {
    it('returns true if ip matches any cidr range', () => {
      expect(matchesAnyCidr('10.0.0.1', ['10.0.0.0/8', '192.168.0.0/16'])).toBe(true)
    })

    it('returns false if ip matches no cidr ranges', () => {
      expect(matchesAnyCidr('8.8.8.8', ['10.0.0.0/8'])).toBe(false)
    })
  })

  describe('ipToInt', () => {
    it('converts ip address to integer', () => {
      expect(ipToInt('10.0.0.1')).toBe(167772161)
      expect(ipToInt('192.168.1.1')).toBe(3232235777)
    })
  })
})
