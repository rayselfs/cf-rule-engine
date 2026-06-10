import { describe, it, expect } from 'vitest'
import { whitelist } from '../../src/helpers/whitelist.js'
import { runRules } from '../../src/core/rule.js'
import { pathMatches } from '../../src/criteria/path-matches.js'

const ALLOWED_IPS = ['203.0.113.10', '10.1.2.3']
const ALLOWED_KEYWORDS = ['InternalBot', 'Prerender']

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
  describe('ips', () => {
    it('allows exact IP in list', () => {
      const r = whitelist({ ips: ALLOWED_IPS, redirectUrl: '/blocked' })
      expect(runRules([r], makeRequest('/', '203.0.113.10')).action).toBe('continue')
    })

    it('allows second IP in list', () => {
      const r = whitelist({ ips: ALLOWED_IPS, redirectUrl: '/blocked' })
      expect(runRules([r], makeRequest('/', '10.1.2.3')).action).toBe('continue')
    })

    it('blocks IP not in list when no uaKeywords configured', () => {
      const r = whitelist({ ips: ALLOWED_IPS, redirectUrl: 'https://example.com' })
      const result = runRules([r], makeRequest('/', '1.2.3.4'))
      expect(result.action).toBe('respond')
      if (result.action === 'respond') {
        expect(result.response.statusCode).toBe(302)
        expect(result.response.headers.location.value).toBe('https://example.com')
      }
    })

    it('blocks all when ips and uaKeywords both omitted', () => {
      const r = whitelist({ redirectUrl: '/blocked' })
      expect(runRules([r], makeRequest('/', '1.2.3.4')).action).toBe('respond')
    })
  })

  describe('uaKeywords', () => {
    it('allows UA containing keyword', () => {
      const r = whitelist({ uaKeywords: ALLOWED_KEYWORDS, redirectUrl: '/blocked' })
      const result = runRules(
        [r],
        makeRequest('/', '1.2.3.4', { 'user-agent': { value: 'InternalBot/2.0' } })
      )
      expect(result.action).toBe('continue')
    })

    it('allows UA containing second keyword', () => {
      const r = whitelist({ uaKeywords: ALLOWED_KEYWORDS, redirectUrl: '/blocked' })
      const result = runRules(
        [r],
        makeRequest('/', '1.2.3.4', { 'user-agent': { value: 'Mozilla/5.0 Prerender' } })
      )
      expect(result.action).toBe('continue')
    })

    it('blocks unknown UA when IP is also not in list', () => {
      const r = whitelist({ ips: ALLOWED_IPS, uaKeywords: ALLOWED_KEYWORDS, redirectUrl: '/blocked' })
      const result = runRules(
        [r],
        makeRequest('/', '1.2.3.4', { 'user-agent': { value: 'Chrome' } })
      )
      expect(result.action).toBe('respond')
    })

    it('allows when uaKeywords omitted and IP matches', () => {
      const r = whitelist({ ips: ALLOWED_IPS, redirectUrl: '/blocked' })
      expect(runRules([r], makeRequest('/', '203.0.113.10')).action).toBe('continue')
    })
  })

  describe('bypassPaths', () => {
    it('bypasses whitelist for exact path', () => {
      const r = whitelist({ ips: ALLOWED_IPS, redirectUrl: '/blocked', bypassPaths: ['/health'] })
      expect(runRules([r], makeRequest('/health', '1.2.3.4')).action).toBe('continue')
    })

    it('does not bypass prefix of bypass path', () => {
      const r = whitelist({ ips: ALLOWED_IPS, redirectUrl: '/blocked', bypassPaths: ['/health'] })
      expect(runRules([r], makeRequest('/healthz', '1.2.3.4')).action).toBe('respond')
    })

    it('bypasses trailing-slash-star pattern', () => {
      const r = whitelist({ ips: ALLOWED_IPS, redirectUrl: '/blocked', bypassPaths: ['/api/*'] })
      expect(runRules([r], makeRequest('/api/status', '1.2.3.4')).action).toBe('continue')
      expect(runRules([r], makeRequest('/api/v2/users', '1.2.3.4')).action).toBe('continue')
    })

    it('does not bypass path outside /* scope', () => {
      const r = whitelist({ ips: ALLOWED_IPS, redirectUrl: '/blocked', bypassPaths: ['/api/*'] })
      expect(runRules([r], makeRequest('/apikey', '1.2.3.4')).action).toBe('respond')
    })

    it('arbitrary wildcard in bypassPaths is silently skipped', () => {
      const r = whitelist({ ips: ALLOWED_IPS, redirectUrl: '/blocked', bypassPaths: ['/static/*.js'] })
      expect(runRules([r], makeRequest('/static/app.js', '1.2.3.4')).action).toBe('respond')
    })

    it('bypassCriteria with pathMatches bypasses mid-wildcard paths', () => {
      const r = whitelist({
        ips: ALLOWED_IPS,
        redirectUrl: '/blocked',
        bypassCriteria: pathMatches(['/static/*.js']),
      })
      expect(runRules([r], makeRequest('/static/app.js', '1.2.3.4')).action).toBe('continue')
      expect(runRules([r], makeRequest('/static/vendor.js', '1.2.3.4')).action).toBe('continue')
    })

    it('bypassCriteria does not bypass non-matching paths', () => {
      const r = whitelist({
        ips: ALLOWED_IPS,
        redirectUrl: '/blocked',
        bypassCriteria: pathMatches(['/static/*.js']),
      })
      expect(runRules([r], makeRequest('/static/app.css', '1.2.3.4')).action).toBe('respond')
    })

    it('bypasses when mixed exact + prefix paths present', () => {
      const r = whitelist({
        ips: ALLOWED_IPS,
        redirectUrl: '/blocked',
        bypassPaths: ['/robots.txt', '/public/*'],
      })
      expect(runRules([r], makeRequest('/robots.txt', '1.2.3.4')).action).toBe('continue')
      expect(runRules([r], makeRequest('/public/logo.png', '1.2.3.4')).action).toBe('continue')
      expect(runRules([r], makeRequest('/admin', '1.2.3.4')).action).toBe('respond')
    })

    it('does not bypass non-matching paths', () => {
      const r = whitelist({ ips: ALLOWED_IPS, redirectUrl: '/blocked', bypassPaths: ['/health'] })
      expect(runRules([r], makeRequest('/other', '1.2.3.4')).action).toBe('respond')
    })
  })

  describe('combined ips + uaKeywords', () => {
    it('allows when IP matches even if UA does not', () => {
      const r = whitelist({ ips: ALLOWED_IPS, uaKeywords: ALLOWED_KEYWORDS, redirectUrl: '/blocked' })
      expect(
        runRules([r], makeRequest('/', '203.0.113.10', { 'user-agent': { value: 'Chrome' } })).action
      ).toBe('continue')
    })

    it('allows when UA matches even if IP does not', () => {
      const r = whitelist({ ips: ALLOWED_IPS, uaKeywords: ALLOWED_KEYWORDS, redirectUrl: '/blocked' })
      expect(
        runRules([r], makeRequest('/', '1.2.3.4', { 'user-agent': { value: 'InternalBot/1.0' } })).action
      ).toBe('continue')
    })

    it('bypass path overrides IP+UA checks', () => {
      const r = whitelist({
        ips: ALLOWED_IPS,
        uaKeywords: ALLOWED_KEYWORDS,
        redirectUrl: '/blocked',
        bypassPaths: ['/open'],
      })
      expect(
        runRules([r], makeRequest('/open', '1.2.3.4', { 'user-agent': { value: 'Chrome' } })).action
      ).toBe('continue')
    })
  })

  describe('redirect behavior', () => {
    it('redirects with 302 to specified URL', () => {
      const r = whitelist({ redirectUrl: 'https://example.com/blocked' })
      const result = runRules([r], makeRequest('/', '1.2.3.4'))
      expect(result.action).toBe('respond')
      if (result.action === 'respond') {
        expect(result.response.statusCode).toBe(302)
        expect(result.response.headers.location.value).toBe('https://example.com/blocked')
      }
    })
  })
})
