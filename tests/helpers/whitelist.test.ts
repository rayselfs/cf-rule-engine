import { describe, it, expect } from 'vitest'
import { whitelist } from '../../src/helpers/whitelist.js'
import { runRules } from '../../src/core/rule.js'
import { pathMatches } from '../../src/criteria/path-matches.js'

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

describe('whitelist', () => {
  describe('cidrs', () => {
    it('allows IP within a specified CIDR', () => {
      const r = whitelist({ cidrs: ALLOWED_CIDRS, redirectUrl: '/blocked' })
      expect(runRules([r], makeRequest('/', '203.0.113.10')).action).toBe('continue')
    })

    it('allows IP in second CIDR range', () => {
      const r = whitelist({ cidrs: ALLOWED_CIDRS, redirectUrl: '/blocked' })
      expect(runRules([r], makeRequest('/', '10.1.2.3')).action).toBe('continue')
    })

    it('blocks IP not in any CIDR (no UAs configured)', () => {
      const r = whitelist({ cidrs: ALLOWED_CIDRS, redirectUrl: 'https://example.com' })
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
      const r = whitelist({ cidrs: [], userAgents: ALLOWED_UAS, redirectUrl: '/blocked' })
      const result = runRules(
        [r],
        makeRequest('/', '1.2.3.4', { 'user-agent': { value: 'InternalBot/2.0' } })
      )
      expect(result.action).toBe('continue')
    })

    it('allows UA matching Prerender pattern', () => {
      const r = whitelist({ cidrs: [], userAgents: ALLOWED_UAS, redirectUrl: '/blocked' })
      const result = runRules(
        [r],
        makeRequest('/', '1.2.3.4', { 'user-agent': { value: 'Mozilla/5.0 Prerender' } })
      )
      expect(result.action).toBe('continue')
    })

    it('blocks unknown UA when IP is also not in CIDR', () => {
      const r = whitelist({
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
      const r = whitelist({ cidrs: ALLOWED_CIDRS, redirectUrl: '/blocked' })
      expect(runRules([r], makeRequest('/', '203.0.113.1')).action).toBe('continue')
    })
  })

  describe('bypassPaths', () => {
    it('bypasses whitelist for exact path (no wildcards → pathEquals)', () => {
      const r = whitelist({
        cidrs: ALLOWED_CIDRS,
        redirectUrl: '/blocked',
        bypassPaths: ['/health'],
      })
      expect(runRules([r], makeRequest('/health', '1.2.3.4')).action).toBe('continue')
    })

    it('does not bypass a path that is only a prefix of the exact bypass path', () => {
      const r = whitelist({
        cidrs: ALLOWED_CIDRS,
        redirectUrl: '/blocked',
        bypassPaths: ['/health'],
      })
      expect(runRules([r], makeRequest('/healthz', '1.2.3.4')).action).toBe('respond')
    })

    it('bypasses whitelist for trailing-slash-star pattern (→ pathPrefix)', () => {
      const r = whitelist({
        cidrs: ALLOWED_CIDRS,
        redirectUrl: '/blocked',
        bypassPaths: ['/api/*'],
      })
      expect(runRules([r], makeRequest('/api/status', '1.2.3.4')).action).toBe('continue')
      expect(runRules([r], makeRequest('/api/v2/users', '1.2.3.4')).action).toBe('continue')
    })

    it('does not bypass path that shares prefix but is outside the /* scope', () => {
      const r = whitelist({
        cidrs: ALLOWED_CIDRS,
        redirectUrl: '/blocked',
        bypassPaths: ['/api/*'],
      })
      expect(runRules([r], makeRequest('/apikey', '1.2.3.4')).action).toBe('respond')
    })

    it('arbitrary wildcard in bypassPaths is silently skipped — path is not bypassed', () => {
      const r = whitelist({
        cidrs: ALLOWED_CIDRS,
        redirectUrl: '/blocked',
        bypassPaths: ['/static/*.js'],
      })
      expect(runRules([r], makeRequest('/static/app.js', '1.2.3.4')).action).toBe('respond')
    })

    it('bypassCriteria with pathMatches bypasses mid-wildcard paths', () => {
      const r = whitelist({
        cidrs: ALLOWED_CIDRS,
        redirectUrl: '/blocked',
        bypassCriteria: pathMatches(['/static/*.js']),
      })
      expect(runRules([r], makeRequest('/static/app.js', '1.2.3.4')).action).toBe('continue')
      expect(runRules([r], makeRequest('/static/vendor.js', '1.2.3.4')).action).toBe('continue')
    })

    it('bypassCriteria does not bypass non-matching paths', () => {
      const r = whitelist({
        cidrs: ALLOWED_CIDRS,
        redirectUrl: '/blocked',
        bypassCriteria: pathMatches(['/static/*.js']),
      })
      expect(runRules([r], makeRequest('/static/app.css', '1.2.3.4')).action).toBe('respond')
    })

    it('bypasses when mixed exact + prefix paths are present', () => {
      const r = whitelist({
        cidrs: ALLOWED_CIDRS,
        redirectUrl: '/blocked',
        bypassPaths: ['/robots.txt', '/public/*'],
      })
      expect(runRules([r], makeRequest('/robots.txt', '1.2.3.4')).action).toBe('continue')
      expect(runRules([r], makeRequest('/public/logo.png', '1.2.3.4')).action).toBe('continue')
      expect(runRules([r], makeRequest('/admin', '1.2.3.4')).action).toBe('respond')
    })

    it('does not bypass non-matching paths', () => {
      const r = whitelist({
        cidrs: ALLOWED_CIDRS,
        redirectUrl: '/blocked',
        bypassPaths: ['/health'],
      })
      expect(runRules([r], makeRequest('/other', '1.2.3.4')).action).toBe('respond')
    })
  })

  describe('combined IP + UA', () => {
    it('allows when IP matches even if UA does not', () => {
      const r = whitelist({
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
      const r = whitelist({
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
      const r = whitelist({
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

  describe('ips (lightweight exact-match alternative to cidrs)', () => {
    it('allows exact IP in the list', () => {
      const r = whitelist({ cidrs: [], ips: ['1.2.3.4'], redirectUrl: '/blocked' })
      expect(runRules([r], makeRequest('/', '1.2.3.4')).action).toBe('continue')
    })

    it('blocks IP not in the list', () => {
      const r = whitelist({ cidrs: [], ips: ['1.2.3.4'], redirectUrl: '/blocked' })
      expect(runRules([r], makeRequest('/', '1.2.3.5')).action).toBe('respond')
    })

    it('cidrs and ips are OR-combined', () => {
      const r = whitelist({ cidrs: ['10.0.0.0/8'], ips: ['1.2.3.4'], redirectUrl: '/blocked' })
      expect(runRules([r], makeRequest('/', '10.0.0.1')).action).toBe('continue')
      expect(runRules([r], makeRequest('/', '1.2.3.4')).action).toBe('continue')
      expect(runRules([r], makeRequest('/', '8.8.8.8')).action).toBe('respond')
    })
  })

  describe('uaKeywords (lightweight substring alternative to userAgents)', () => {
    it('allows UA containing the keyword', () => {
      const r = whitelist({ cidrs: [], uaKeywords: ['Prerender'], redirectUrl: '/blocked' })
      const result = runRules(
        [r],
        makeRequest('/', '1.2.3.4', { 'user-agent': { value: 'Prerender/2.0' } })
      )
      expect(result.action).toBe('continue')
    })

    it('blocks UA not containing any keyword', () => {
      const r = whitelist({ cidrs: [], uaKeywords: ['Prerender'], redirectUrl: '/blocked' })
      expect(
        runRules([r], makeRequest('/', '1.2.3.4', { 'user-agent': { value: 'Chrome' } })).action
      ).toBe('respond')
    })

    it('userAgents and uaKeywords are OR-combined', () => {
      const r = whitelist({
        cidrs: [],
        userAgents: ['*InternalBot*'],
        uaKeywords: ['Prerender'],
        redirectUrl: '/blocked',
      })
      expect(
        runRules([r], makeRequest('/', '1.2.3.4', { 'user-agent': { value: 'InternalBot/1.0' } })).action
      ).toBe('continue')
      expect(
        runRules([r], makeRequest('/', '1.2.3.4', { 'user-agent': { value: 'Prerender/2.0' } })).action
      ).toBe('continue')
      expect(
        runRules([r], makeRequest('/', '1.2.3.4', { 'user-agent': { value: 'Chrome' } })).action
      ).toBe('respond')
    })

    it('ips + uaKeywords together replace cidrs + userAgents', () => {
      const r = whitelist({
        cidrs: [],
        ips: ['61.218.44.76'],
        uaKeywords: ['HTCVRSDET', 'Prerender'],
        redirectUrl: '/blocked',
      })
      expect(runRules([r], makeRequest('/', '61.218.44.76')).action).toBe('continue')
      expect(
        runRules([r], makeRequest('/', '1.2.3.4', { 'user-agent': { value: 'HTCVRSDET-Crawler' } })).action
      ).toBe('continue')
      expect(runRules([r], makeRequest('/', '1.2.3.4')).action).toBe('respond')
    })
  })

  describe('redirect behavior', () => {
    it('redirects with 302 to the specified URL', () => {
      const r = whitelist({ cidrs: [], redirectUrl: 'https://example.com/blocked' })
      const result = runRules([r], makeRequest('/', '1.2.3.4'))
      expect(result.action).toBe('respond')
      if (result.action === 'respond') {
        expect(result.response.statusCode).toBe(302)
        expect(result.response.headers.location.value).toBe('https://example.com/blocked')
      }
    })
  })
})
