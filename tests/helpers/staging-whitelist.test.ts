import { describe, it, expect } from 'vitest'
import { stagingWhitelist } from '../../src/helpers/staging-whitelist.js'
import { runRules } from '../../src/core/rule.js'

const ALLOWED_CIDRS = ['203.0.113.0/24', '10.0.0.0/8']
const ALLOWED_UAS = ['*InternalBot*', '*Prerender*']

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

describe('stagingWhitelist', () => {
  describe('cidrs', () => {
    it('allows IP within a specified CIDR', () => {
      const r = stagingWhitelist({ cidrs: ALLOWED_CIDRS, redirectUrl: '/blocked' })
      expect(runRules([r], makeRequest('/', '203.0.113.10')).action).toBe('continue')
    })

    it('allows IP in second CIDR range', () => {
      const r = stagingWhitelist({ cidrs: ALLOWED_CIDRS, redirectUrl: '/blocked' })
      expect(runRules([r], makeRequest('/', '10.1.2.3')).action).toBe('continue')
    })

    it('blocks IP not in any CIDR (no UAs configured)', () => {
      const r = stagingWhitelist({ cidrs: ALLOWED_CIDRS, redirectUrl: 'https://example.com' })
      const result = runRules([r], makeRequest('/', '1.2.3.4'))
      expect(result.action).toBe('respond')
      if (result.action === 'respond') {
        expect(result.response.statusCode).toBe(302)
        expect(result.response.headers.location.value).toBe('https://example.com')
      }
    })
  })

  describe('userAgents', () => {
    it('allows UA matching a wildcard pattern', () => {
      const r = stagingWhitelist({ cidrs: [], userAgents: ALLOWED_UAS, redirectUrl: '/blocked' })
      const result = runRules(
        [r],
        makeRequest('/', '1.2.3.4', { 'user-agent': { value: 'InternalBot/2.0' } })
      )
      expect(result.action).toBe('continue')
    })

    it('allows UA matching Prerender pattern', () => {
      const r = stagingWhitelist({ cidrs: [], userAgents: ALLOWED_UAS, redirectUrl: '/blocked' })
      const result = runRules(
        [r],
        makeRequest('/', '1.2.3.4', { 'user-agent': { value: 'Mozilla/5.0 Prerender' } })
      )
      expect(result.action).toBe('continue')
    })

    it('blocks unknown UA when IP is also not in CIDR', () => {
      const r = stagingWhitelist({
        cidrs: ALLOWED_CIDRS,
        userAgents: ALLOWED_UAS,
        redirectUrl: '/blocked',
      })
      const result = runRules(
        [r],
        makeRequest('/', '1.2.3.4', { 'user-agent': { value: 'Mozilla/5.0' } })
      )
      expect(result.action).toBe('respond')
    })

    it('allows when userAgents is omitted and IP matches', () => {
      const r = stagingWhitelist({ cidrs: ALLOWED_CIDRS, redirectUrl: '/blocked' })
      expect(runRules([r], makeRequest('/', '203.0.113.1')).action).toBe('continue')
    })
  })

  describe('bypassPaths', () => {
    it('bypasses whitelist for specified exact path', () => {
      const r = stagingWhitelist({
        cidrs: ALLOWED_CIDRS,
        redirectUrl: '/blocked',
        bypassPaths: ['/health'],
      })
      expect(runRules([r], makeRequest('/health', '1.2.3.4')).action).toBe('continue')
    })

    it('bypasses whitelist for wildcard path', () => {
      const r = stagingWhitelist({
        cidrs: ALLOWED_CIDRS,
        redirectUrl: '/blocked',
        bypassPaths: ['/api/*'],
      })
      expect(runRules([r], makeRequest('/api/status', '1.2.3.4')).action).toBe('continue')
      expect(runRules([r], makeRequest('/api/v2/users', '1.2.3.4')).action).toBe('continue')
    })

    it('does not bypass non-matching paths', () => {
      const r = stagingWhitelist({
        cidrs: ALLOWED_CIDRS,
        redirectUrl: '/blocked',
        bypassPaths: ['/health'],
      })
      expect(runRules([r], makeRequest('/other', '1.2.3.4')).action).toBe('respond')
    })
  })

  describe('combined IP + UA', () => {
    it('allows when IP matches even if UA does not', () => {
      const r = stagingWhitelist({
        cidrs: ALLOWED_CIDRS,
        userAgents: ALLOWED_UAS,
        redirectUrl: '/blocked',
      })
      const result = runRules(
        [r],
        makeRequest('/', '203.0.113.5', { 'user-agent': { value: 'Chrome' } })
      )
      expect(result.action).toBe('continue')
    })

    it('allows when UA matches even if IP does not', () => {
      const r = stagingWhitelist({
        cidrs: ALLOWED_CIDRS,
        userAgents: ALLOWED_UAS,
        redirectUrl: '/blocked',
      })
      const result = runRules(
        [r],
        makeRequest('/', '1.2.3.4', { 'user-agent': { value: 'InternalBot/1.0' } })
      )
      expect(result.action).toBe('continue')
    })

    it('bypass path overrides IP+UA checks', () => {
      const r = stagingWhitelist({
        cidrs: ALLOWED_CIDRS,
        userAgents: ALLOWED_UAS,
        redirectUrl: '/blocked',
        bypassPaths: ['/open'],
      })
      const result = runRules(
        [r],
        makeRequest('/open', '1.2.3.4', { 'user-agent': { value: 'Chrome' } })
      )
      expect(result.action).toBe('continue')
    })
  })

  describe('redirect behavior', () => {
    it('redirects with 302 to the specified URL', () => {
      const r = stagingWhitelist({ cidrs: [], redirectUrl: 'https://example.com/blocked' })
      const result = runRules([r], makeRequest('/', '1.2.3.4'))
      expect(result.action).toBe('respond')
      if (result.action === 'respond') {
        expect(result.response.statusCode).toBe(302)
        expect(result.response.headers.location.value).toBe('https://example.com/blocked')
      }
    })
  })
})
