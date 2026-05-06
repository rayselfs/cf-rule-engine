import { describe, it, expect } from 'vitest'
import { viverseWhitelist } from '../../src/helpers/viverse-whitelist.js'
import { runRules } from '../../src/core/rule.js'

const makeRequest = (
  uri: string,
  clientIp: string,
  headers?: Record<string, { value: string }>
) => ({
  uri,
  method: 'GET',
  protocol: 'https',
  querystring: {},
  headers: headers || {},
  clientIp,
})

describe('viverseWhitelist', () => {
  describe('default CIDRs and UAs', () => {
    it('allows HTC office IP (61.218.44.76)', () => {
      const rule = viverseWhitelist({ redirectUrl: '/blocked' })
      const result = runRules([rule], makeRequest('/', '61.218.44.76'))
      expect(result.action).toBe('continue')
    })

    it('allows HTC VPN IP (175.98.157.254)', () => {
      const rule = viverseWhitelist({ redirectUrl: '/blocked' })
      const result = runRules([rule], makeRequest('/', '175.98.157.254'))
      expect(result.action).toBe('continue')
    })

    it('allows stage VPC IP (52.33.9.56)', () => {
      const rule = viverseWhitelist({ redirectUrl: '/blocked' })
      const result = runRules([rule], makeRequest('/', '52.33.9.56'))
      expect(result.action).toBe('continue')
    })

    it('allows HTCVRSDET user agent', () => {
      const rule = viverseWhitelist({ redirectUrl: '/blocked' })
      const result = runRules(
        [rule],
        makeRequest('/', '1.2.3.4', { 'user-agent': { value: 'HTCVRSDET/1.0' } })
      )
      expect(result.action).toBe('continue')
    })

    it('allows Prerender bot', () => {
      const rule = viverseWhitelist({ redirectUrl: '/blocked' })
      const result = runRules(
        [rule],
        makeRequest('/', '1.2.3.4', { 'user-agent': { value: 'Mozilla/5.0 Prerender' } })
      )
      expect(result.action).toBe('continue')
    })

    it('allows HTC3PARTY user agent', () => {
      const rule = viverseWhitelist({ redirectUrl: '/blocked' })
      const result = runRules(
        [rule],
        makeRequest('/', '1.2.3.4', { 'user-agent': { value: 'HTC3PARTY-Service' } })
      )
      expect(result.action).toBe('continue')
    })

    it('blocks unknown IP with unknown UA', () => {
      const rule = viverseWhitelist({ redirectUrl: 'https://www.viverse.com' })
      const result = runRules(
        [rule],
        makeRequest('/', '203.0.113.1', { 'user-agent': { value: 'Mozilla/5.0' } })
      )
      expect(result.action).toBe('respond')
      if (result.action === 'respond') {
        expect(result.response.statusCode).toBe(302)
        expect(result.response.headers.location.value).toBe('https://www.viverse.com')
      }
    })
  })

  describe('additionalCidrs', () => {
    it('allows IP from additional CIDRs', () => {
      const rule = viverseWhitelist({
        redirectUrl: '/blocked',
        additionalCidrs: ['198.51.100.0/24'],
      })
      const result = runRules([rule], makeRequest('/', '198.51.100.10'))
      expect(result.action).toBe('continue')
    })

    it('merges additional CIDRs with defaults', () => {
      const rule = viverseWhitelist({
        redirectUrl: '/blocked',
        additionalCidrs: ['203.0.113.0/24'],
      })
      const defaultIpResult = runRules([rule], makeRequest('/', '61.218.44.76'))
      expect(defaultIpResult.action).toBe('continue')

      const additionalIpResult = runRules([rule], makeRequest('/', '203.0.113.50'))
      expect(additionalIpResult.action).toBe('continue')

      const unknownIpResult = runRules([rule], makeRequest('/', '1.1.1.1'))
      expect(unknownIpResult.action).toBe('respond')
    })
  })

  describe('additionalUAs', () => {
    it('allows UA from additional patterns', () => {
      const rule = viverseWhitelist({
        redirectUrl: '/blocked',
        additionalUAs: ['*CustomBot*'],
      })
      const result = runRules(
        [rule],
        makeRequest('/', '1.2.3.4', { 'user-agent': { value: 'CustomBot/2.0' } })
      )
      expect(result.action).toBe('continue')
    })

    it('merges additional UAs with defaults', () => {
      const rule = viverseWhitelist({
        redirectUrl: '/blocked',
        additionalUAs: ['*TestUA*'],
      })
      const defaultUaResult = runRules(
        [rule],
        makeRequest('/', '1.2.3.4', { 'user-agent': { value: 'HTCVRSDET' } })
      )
      expect(defaultUaResult.action).toBe('continue')

      const additionalUaResult = runRules(
        [rule],
        makeRequest('/', '1.2.3.4', { 'user-agent': { value: 'TestUA-Bot' } })
      )
      expect(additionalUaResult.action).toBe('continue')
    })
  })

  describe('bypassPaths', () => {
    it('bypasses whitelist check for specified paths', () => {
      const rule = viverseWhitelist({
        redirectUrl: '/blocked',
        bypassPaths: ['/api/*', '/health'],
      })
      const apiPathResult = runRules([rule], makeRequest('/api/status', '1.2.3.4'))
      expect(apiPathResult.action).toBe('continue')

      const healthPathResult = runRules([rule], makeRequest('/health', '1.2.3.4'))
      expect(healthPathResult.action).toBe('continue')

      const otherPathResult = runRules([rule], makeRequest('/', '1.2.3.4'))
      expect(otherPathResult.action).toBe('respond')
    })

    it('works with wildcard patterns', () => {
      const rule = viverseWhitelist({
        redirectUrl: '/blocked',
        bypassPaths: ['/public/*'],
      })
      const publicImageResult = runRules([rule], makeRequest('/public/images/logo.png', '1.2.3.4'))
      expect(publicImageResult.action).toBe('continue')

      const publicCssResult = runRules([rule], makeRequest('/public/css/style.css', '1.2.3.4'))
      expect(publicCssResult.action).toBe('continue')

      const privatePathResult = runRules([rule], makeRequest('/private/data', '1.2.3.4'))
      expect(privatePathResult.action).toBe('respond')
    })
  })

  describe('redirect behavior', () => {
    it('redirects to specified URL when blocked', () => {
      const rule = viverseWhitelist({ redirectUrl: 'https://example.com/access-denied' })
      const result = runRules([rule], makeRequest('/', '1.2.3.4'))
      expect(result.action).toBe('respond')
      if (result.action === 'respond') {
        expect(result.response.statusCode).toBe(302)
        expect(result.response.headers.location.value).toBe(
          'https://example.com/access-denied'
        )
      }
    })
  })

  describe('combined conditions', () => {
    it('allows when either IP or UA matches', () => {
      const rule = viverseWhitelist({ redirectUrl: '/blocked' })
      
      const whitelistedIpResult = runRules(
        [rule],
        makeRequest('/', '61.218.44.76', { 'user-agent': { value: 'Chrome' } })
      )
      expect(whitelistedIpResult.action).toBe('continue')

      const whitelistedUaResult = runRules(
        [rule],
        makeRequest('/', '1.2.3.4', { 'user-agent': { value: 'HTCVRSDET' } })
      )
      expect(whitelistedUaResult.action).toBe('continue')

      const bothWhitelistedResult = runRules(
        [rule],
        makeRequest('/', '61.218.44.76', { 'user-agent': { value: 'HTCVRSDET' } })
      )
      expect(bothWhitelistedResult.action).toBe('continue')

      const neitherWhitelistedResult = runRules(
        [rule],
        makeRequest('/', '1.2.3.4', { 'user-agent': { value: 'Chrome' } })
      )
      expect(neitherWhitelistedResult.action).toBe('respond')
    })

    it('bypass paths override IP/UA checks', () => {
      const rule = viverseWhitelist({
        redirectUrl: '/blocked',
        bypassPaths: ['/open'],
      })
      const bypassPathResult = runRules(
        [rule],
        makeRequest('/open', '1.2.3.4', { 'user-agent': { value: 'Chrome' } })
      )
      expect(bypassPathResult.action).toBe('continue')
    })
  })
})
