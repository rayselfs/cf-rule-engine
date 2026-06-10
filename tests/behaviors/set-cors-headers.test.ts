import { describe, it, expect } from 'vitest'
import { setCorsHeaders, ORIGIN_WILDCARD, ORIGIN_ECHO } from '../../src/behaviors/set-cors-headers.js'
import { originMatcher } from '../../src/behaviors/origin-matcher.js'

const baseRequest = {
  uri: '/',
  method: 'GET',
  protocol: 'https',
  querystring: {},
  headers: {},
  clientIp: '1.2.3.4',
}

const baseResponse = { statusCode: 200, headers: {} }

describe('setCorsHeaders', () => {
  describe('ORIGIN_WILDCARD', () => {
    it('sets static Access-Control-Allow-Origin: *', () => {
      const fn = setCorsHeaders({ allowedOrigins: ORIGIN_WILDCARD })
      const result = fn(baseRequest, baseResponse)
      expect(result.headers['access-control-allow-origin']).toEqual({ value: '*' })
    })

    it('does not set methods or headers unless explicitly provided', () => {
      const fn = setCorsHeaders({ allowedOrigins: ORIGIN_WILDCARD })
      const result = fn(baseRequest, baseResponse)
      expect(result.headers['access-control-allow-methods']).toBeUndefined()
      expect(result.headers['access-control-allow-headers']).toBeUndefined()
    })
  })

  describe('ORIGIN_ECHO', () => {
    it('echoes the request Origin header when present', () => {
      const fn = setCorsHeaders({ allowedOrigins: ORIGIN_ECHO })
      const req = { ...baseRequest, headers: { origin: { value: 'https://example.com' } } }
      const result = fn(req, baseResponse)
      expect(result.headers['access-control-allow-origin']).toEqual({ value: 'https://example.com' })
    })

    it('returns response unchanged when no Origin header', () => {
      const fn = setCorsHeaders({ allowedOrigins: ORIGIN_ECHO })
      const result = fn(baseRequest, baseResponse)
      expect(result.headers['access-control-allow-origin']).toBeUndefined()
    })
  })

  describe('OriginMatcher — compare-and-echo', () => {
    it('echoes origin when it matches an exact domain', () => {
      const fn = setCorsHeaders({ allowedOrigins: originMatcher(['https://example.com']) })
      const req = { ...baseRequest, headers: { origin: { value: 'https://example.com' } } }
      const result = fn(req, baseResponse)
      expect(result.headers['access-control-allow-origin']).toEqual({ value: 'https://example.com' })
    })

    it('echoes origin when it matches a wildcard pattern', () => {
      const fn = setCorsHeaders({ allowedOrigins: originMatcher(['https://*.viverse.com']) })
      const req = { ...baseRequest, headers: { origin: { value: 'https://sdk-api.viverse.com' } } }
      const result = fn(req, baseResponse)
      expect(result.headers['access-control-allow-origin']).toEqual({ value: 'https://sdk-api.viverse.com' })
    })

    it('skips header when origin does not match any pattern', () => {
      const fn = setCorsHeaders({ allowedOrigins: originMatcher(['https://example.com']) })
      const req = { ...baseRequest, headers: { origin: { value: 'https://evil.com' } } }
      const result = fn(req, baseResponse)
      expect(result.headers['access-control-allow-origin']).toBeUndefined()
    })

    it('skips header when no Origin header is present', () => {
      const fn = setCorsHeaders({ allowedOrigins: originMatcher(['https://example.com']) })
      const result = fn(baseRequest, baseResponse)
      expect(result.headers['access-control-allow-origin']).toBeUndefined()
    })

    it('does not throw when originMatcher receives empty list', () => {
      expect(() => setCorsHeaders({ allowedOrigins: originMatcher([]) })).not.toThrow()
    })
  })

  describe('optional headers', () => {
    it('sets allowedMethods when provided', () => {
      const fn = setCorsHeaders({ allowedOrigins: ORIGIN_WILDCARD, allowedMethods: ['GET', 'POST'] })
      const result = fn(baseRequest, baseResponse)
      expect(result.headers['access-control-allow-methods']).toEqual({ value: 'GET, POST' })
    })

    it('sets allowedMethods as single-element array', () => {
      const fn = setCorsHeaders({ allowedOrigins: ORIGIN_WILDCARD, allowedMethods: ['OPTIONS'] })
      const result = fn(baseRequest, baseResponse)
      expect(result.headers['access-control-allow-methods']).toEqual({ value: 'OPTIONS' })
    })

    it('sets allowedHeaders when provided', () => {
      const fn = setCorsHeaders({ allowedOrigins: ORIGIN_WILDCARD, allowedHeaders: ['Content-Type'] })
      const result = fn(baseRequest, baseResponse)
      expect(result.headers['access-control-allow-headers']).toEqual({ value: 'Content-Type' })
    })

    it('sets allowedHeaders with multiple values joined by ", "', () => {
      const fn = setCorsHeaders({
        allowedOrigins: ORIGIN_WILDCARD,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      })
      const result = fn(baseRequest, baseResponse)
      expect(result.headers['access-control-allow-headers']).toEqual({
        value: 'Content-Type, Authorization, X-Request-Id',
      })
    })

    it('sets allow-credentials when allowCredentials is true', () => {
      const fn = setCorsHeaders({ allowedOrigins: ORIGIN_WILDCARD, allowCredentials: true })
      const result = fn(baseRequest, baseResponse)
      expect(result.headers['access-control-allow-credentials']).toEqual({ value: 'true' })
    })

    it('sets max-age when provided', () => {
      const fn = setCorsHeaders({ allowedOrigins: ORIGIN_WILDCARD, maxAge: 3600 })
      const result = fn(baseRequest, baseResponse)
      expect(result.headers['access-control-max-age']).toEqual({ value: '3600' })
    })
  })
})
