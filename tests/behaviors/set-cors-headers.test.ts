import { describe, it, expect } from 'vitest'
import { setCorsHeaders } from '../../src/behaviors/set-cors-headers.js'

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
  it('sets default CORS headers with wildcard origin', () => {
    const fn = setCorsHeaders({ allowedOrigins: ['*'] })
    const result = fn(baseRequest, baseResponse)
    expect(result.headers['access-control-allow-origin']).toEqual({ value: '*' })
    expect(result.headers['access-control-allow-methods']).toBeUndefined()
    expect(result.headers['access-control-allow-headers']).toBeUndefined()
  })

  it('uses wildcard origin when allowedOrigins is [\'*\']', () => {
    const fn = setCorsHeaders({ allowedOrigins: ['*'] })
    const result = fn(baseRequest, baseResponse)
    expect(result.headers['access-control-allow-origin'].value).toBe('*')
  })

  it('throws when allowedOrigins is empty', () => {
    expect(() => setCorsHeaders({ allowedOrigins: [] })).toThrow('allowedOrigins must not be empty')
  })

  it('echoes origin when allowOriginEcho and origin matches', () => {
    const fn = setCorsHeaders({
      allowedOrigins: ['https://example.com'],
      allowOriginEcho: true,
    })
    const req = { ...baseRequest, headers: { origin: { value: 'https://example.com' } } }
    const result = fn(req, baseResponse)
    expect(result.headers['access-control-allow-origin'].value).toBe('https://example.com')
  })

  it('does not echo origin when origin not in allowed list', () => {
    const fn = setCorsHeaders({
      allowedOrigins: ['https://example.com'],
      allowOriginEcho: true,
    })
    const req = { ...baseRequest, headers: { origin: { value: 'https://evil.com' } } }
    const result = fn(req, baseResponse)
    expect(result.headers['access-control-allow-origin'].value).toBe('https://example.com')
  })

  it('sets allow-credentials when enabled', () => {
    const fn = setCorsHeaders({ allowedOrigins: ['*'], allowCredentials: true })
    const result = fn(baseRequest, baseResponse)
    expect(result.headers['access-control-allow-credentials'].value).toBe('true')
  })

  it('sets max-age when provided', () => {
    const fn = setCorsHeaders({ allowedOrigins: ['*'], maxAge: 3600 })
    const result = fn(baseRequest, baseResponse)
    expect(result.headers['access-control-max-age'].value).toBe('3600')
  })
})
