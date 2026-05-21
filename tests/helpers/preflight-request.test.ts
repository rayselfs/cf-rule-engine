import { describe, it, expect } from 'vitest'
import { preflightRequest } from '../../src/helpers/preflight-request.js'

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
      const rule = preflightRequest()
      expect(rule.criteria!(makeRequest('OPTIONS'))).toBe(true)
    })

    it('does not match GET', () => {
      const rule = preflightRequest()
      expect(rule.criteria!(makeRequest('GET'))).toBe(false)
    })

    it('does not match POST', () => {
      const rule = preflightRequest()
      expect(rule.criteria!(makeRequest('POST'))).toBe(false)
    })
  })

  describe('default options', () => {
    it('responds 204 with default CORS headers', () => {
      const rule = preflightRequest()
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
      const rule = preflightRequest()
      const result = rule.behavior(makeRequest('OPTIONS'))
      if (result.action === 'respond') {
        expect(result.response.headers['cache-control']).toEqual({ value: 'no-store' })
      }
    })

    it('omits access-control-allow-credentials by default', () => {
      const rule = preflightRequest()
      const result = rule.behavior(makeRequest('OPTIONS'))
      if (result.action === 'respond') {
        expect(result.response.headers['access-control-allow-credentials']).toBeUndefined()
      }
    })

    it('omits access-control-max-age by default', () => {
      const rule = preflightRequest()
      const result = rule.behavior(makeRequest('OPTIONS'))
      if (result.action === 'respond') {
        expect(result.response.headers['access-control-max-age']).toBeUndefined()
      }
    })
  })

  describe('custom options', () => {
    it('uses custom allowedOrigins', () => {
      const rule = preflightRequest({ allowedOrigins: ['https://www.viverse.com'] })
      const result = rule.behavior(makeRequest('OPTIONS'))
      if (result.action === 'respond') {
        expect(result.response.headers['access-control-allow-origin']).toEqual({
          value: 'https://www.viverse.com',
        })
      }
    })

    it('uses custom allowedMethods', () => {
      const rule = preflightRequest({ allowedMethods: 'GET, POST, PUT, DELETE, OPTIONS' })
      const result = rule.behavior(makeRequest('OPTIONS'))
      if (result.action === 'respond') {
        expect(result.response.headers['access-control-allow-methods']).toEqual({
          value: 'GET, POST, PUT, DELETE, OPTIONS',
        })
      }
    })

    it('sets access-control-allow-credentials when allowCredentials is true', () => {
      const rule = preflightRequest({ allowCredentials: true })
      const result = rule.behavior(makeRequest('OPTIONS'))
      if (result.action === 'respond') {
        expect(result.response.headers['access-control-allow-credentials']).toEqual({ value: 'true' })
      }
    })

    it('sets access-control-max-age when maxAge is specified', () => {
      const rule = preflightRequest({ maxAge: 86400 })
      const result = rule.behavior(makeRequest('OPTIONS'))
      if (result.action === 'respond') {
        expect(result.response.headers['access-control-max-age']).toEqual({ value: '86400' })
      }
    })
  })

  describe('allowOriginEcho', () => {
    it('echoes matching origin', () => {
      const rule = preflightRequest({
        allowedOrigins: ['https://www.viverse.com'],
        allowOriginEcho: true,
      })
      const result = rule.behavior(
        makeRequest('OPTIONS', { origin: { value: 'https://www.viverse.com' } })
      )
      if (result.action === 'respond') {
        expect(result.response.headers['access-control-allow-origin']).toEqual({
          value: 'https://www.viverse.com',
        })
      }
    })

    it('echoes matching wildcard origin', () => {
      const rule = preflightRequest({
        allowedOrigins: ['https://*.viverse.com'],
        allowOriginEcho: true,
      })
      const result = rule.behavior(
        makeRequest('OPTIONS', { origin: { value: 'https://stream.viverse.com' } })
      )
      if (result.action === 'respond') {
        expect(result.response.headers['access-control-allow-origin']).toEqual({
          value: 'https://stream.viverse.com',
        })
      }
    })

    it('falls back to first allowedOrigin when request origin does not match', () => {
      const rule = preflightRequest({
        allowedOrigins: ['https://www.viverse.com'],
        allowOriginEcho: true,
      })
      const result = rule.behavior(
        makeRequest('OPTIONS', { origin: { value: 'https://evil.com' } })
      )
      if (result.action === 'respond') {
        expect(result.response.headers['access-control-allow-origin']).toEqual({
          value: 'https://www.viverse.com',
        })
      }
    })

    it('falls back to first allowedOrigin when no origin header is present', () => {
      const rule = preflightRequest({
        allowedOrigins: ['https://www.viverse.com'],
        allowOriginEcho: true,
      })
      const result = rule.behavior(makeRequest('OPTIONS'))
      if (result.action === 'respond') {
        expect(result.response.headers['access-control-allow-origin']).toEqual({
          value: 'https://www.viverse.com',
        })
      }
    })
  })

  describe('shared CorsOptions with setCorsHeaders', () => {
    it('accepts the same options object without error', () => {
      const CORS = {
        allowedOrigins: ['*'],
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
