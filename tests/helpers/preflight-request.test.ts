import { describe, it, expect } from 'vitest'
import { preflightRequest } from '../../src/helpers/preflight-request.js'
import { ORIGIN_WILDCARD, ORIGIN_ECHO } from '../../src/behaviors/set-cors-headers.js'

const makeRequest = (method: string, headers: Record<string, { value: string }> = {}) => ({
  uri: '/',
  method,
  protocol: 'https',
  querystring: {},
  headers,
  clientIp: '1.2.3.4',
})

describe('preflightRequest', () => {
  describe('criteria', () => {
    it('matches OPTIONS', () => {
      const rule = preflightRequest({ allowedOrigins: ORIGIN_WILDCARD })
      expect(rule.criteria!(makeRequest('OPTIONS'))).toBe(true)
    })

    it('does not match GET', () => {
      const rule = preflightRequest({ allowedOrigins: ORIGIN_WILDCARD })
      expect(rule.criteria!(makeRequest('GET'))).toBe(false)
    })

    it('does not match POST', () => {
      const rule = preflightRequest({ allowedOrigins: ORIGIN_WILDCARD })
      expect(rule.criteria!(makeRequest('POST'))).toBe(false)
    })
  })

  describe('ORIGIN_WILDCARD', () => {
    it('responds 204 with Access-Control-Allow-Origin: *', () => {
      const rule = preflightRequest({ allowedOrigins: ORIGIN_WILDCARD })
      const result = rule.behavior(makeRequest('OPTIONS'))
      expect(result.action).toBe('respond')
      if (result.action === 'respond') {
        expect(result.response.statusCode).toBe(204)
        expect(result.response.headers['access-control-allow-origin']).toEqual({ value: '*' })
        expect(result.response.headers['access-control-allow-methods']).toEqual({ value: 'GET, POST, OPTIONS' })
        expect(result.response.headers['access-control-allow-headers']).toEqual({
          value: 'Content-Type, Cache-Control, Pragma, Range',
        })
      }
    })

    it('always includes cache-control: no-store', () => {
      const rule = preflightRequest({ allowedOrigins: ORIGIN_WILDCARD })
      const result = rule.behavior(makeRequest('OPTIONS'))
      if (result.action === 'respond') {
        expect(result.response.headers['cache-control']).toEqual({ value: 'no-store' })
      }
    })

    it('omits access-control-allow-credentials by default', () => {
      const rule = preflightRequest({ allowedOrigins: ORIGIN_WILDCARD })
      const result = rule.behavior(makeRequest('OPTIONS'))
      if (result.action === 'respond') {
        expect(result.response.headers['access-control-allow-credentials']).toBeUndefined()
      }
    })

    it('omits access-control-max-age by default', () => {
      const rule = preflightRequest({ allowedOrigins: ORIGIN_WILDCARD })
      const result = rule.behavior(makeRequest('OPTIONS'))
      if (result.action === 'respond') {
        expect(result.response.headers['access-control-max-age']).toBeUndefined()
      }
    })
  })

  describe('custom options', () => {
    it('uses custom allowedMethods', () => {
      const rule = preflightRequest({ allowedOrigins: ORIGIN_WILDCARD, allowedMethods: 'GET, POST, PUT, DELETE, OPTIONS' })
      const result = rule.behavior(makeRequest('OPTIONS'))
      if (result.action === 'respond') {
        expect(result.response.headers['access-control-allow-methods']).toEqual({
          value: 'GET, POST, PUT, DELETE, OPTIONS',
        })
      }
    })

    it('sets access-control-allow-credentials when allowCredentials is true', () => {
      const rule = preflightRequest({ allowedOrigins: ORIGIN_WILDCARD, allowCredentials: true })
      const result = rule.behavior(makeRequest('OPTIONS'))
      if (result.action === 'respond') {
        expect(result.response.headers['access-control-allow-credentials']).toEqual({ value: 'true' })
      }
    })

    it('sets access-control-max-age when maxAge is specified', () => {
      const rule = preflightRequest({ allowedOrigins: ORIGIN_WILDCARD, maxAge: 86400 })
      const result = rule.behavior(makeRequest('OPTIONS'))
      if (result.action === 'respond') {
        expect(result.response.headers['access-control-max-age']).toEqual({ value: '86400' })
      }
    })
  })

  describe('Origin[] — compare-and-echo', () => {
    it('echoes matching origin', () => {
      const rule = preflightRequest({ allowedOrigins: ['https://www.example.com'] })
      const result = rule.behavior(
        makeRequest('OPTIONS', { origin: { value: 'https://www.example.com' } })
      )
      if (result.action === 'respond') {
        expect(result.response.headers['access-control-allow-origin']).toEqual({
          value: 'https://www.example.com',
        })
      }
    })

    it('echoes matching wildcard origin', () => {
      const rule = preflightRequest({ allowedOrigins: ['https://*.example.com'] })
      const result = rule.behavior(
        makeRequest('OPTIONS', { origin: { value: 'https://stream.example.com' } })
      )
      if (result.action === 'respond') {
        expect(result.response.headers['access-control-allow-origin']).toEqual({
          value: 'https://stream.example.com',
        })
      }
    })

    it('omits header when request origin does not match', () => {
      const rule = preflightRequest({ allowedOrigins: ['https://www.example.com'] })
      const result = rule.behavior(
        makeRequest('OPTIONS', { origin: { value: 'https://evil.com' } })
      )
      if (result.action === 'respond') {
        expect(result.response.headers['access-control-allow-origin']).toBeUndefined()
      }
    })

    it('omits header when no origin header is present', () => {
      const rule = preflightRequest({ allowedOrigins: ['https://www.example.com'] })
      const result = rule.behavior(makeRequest('OPTIONS'))
      if (result.action === 'respond') {
        expect(result.response.headers['access-control-allow-origin']).toBeUndefined()
      }
    })
  })

  describe('ORIGIN_ECHO', () => {
    it('echoes any origin when present', () => {
      const rule = preflightRequest({ allowedOrigins: ORIGIN_ECHO })
      const result = rule.behavior(
        makeRequest('OPTIONS', { origin: { value: 'https://any.example.com' } })
      )
      if (result.action === 'respond') {
        expect(result.response.headers['access-control-allow-origin']).toEqual({
          value: 'https://any.example.com',
        })
      }
    })

    it('omits header when no origin header is present', () => {
      const rule = preflightRequest({ allowedOrigins: ORIGIN_ECHO })
      const result = rule.behavior(makeRequest('OPTIONS'))
      if (result.action === 'respond') {
        expect(result.response.headers['access-control-allow-origin']).toBeUndefined()
      }
    })
  })

  describe('shared CorsOptions with setCorsHeaders', () => {
    it('accepts the same options object without error', () => {
      const CORS = {
        allowedOrigins: ORIGIN_WILDCARD,
        allowedMethods: 'GET, POST, OPTIONS',
        allowedHeaders: 'Content-Type, Authorization',
        maxAge: 3600,
      }
      expect(() => preflightRequest(CORS)).not.toThrow()
      const rule = preflightRequest(CORS)
      const result = rule.behavior(makeRequest('OPTIONS'))
      expect(result.action).toBe('respond')
      if (result.action === 'respond') {
        expect(result.response.headers['access-control-allow-origin']).toEqual({ value: '*' })
        expect(result.response.headers['access-control-max-age']).toEqual({ value: '3600' })
      }
    })
  })
})
