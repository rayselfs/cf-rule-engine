import { describe, it, expect } from 'vitest'
import { copyHeader } from '../../src/behaviors/copy-header.js'

const makeRequest = (headers: Record<string, { value: string }>) => ({
  uri: '/',
  method: 'GET',
  protocol: 'https',
  querystring: {},
  headers,
  clientIp: '1.2.3.4',
})

describe('copyHeader', () => {
  it('copies source header to target header', () => {
    const fn = copyHeader('X-Source', 'X-Target')
    const result = fn(makeRequest({ 'x-source': { value: 'hello' } }))
    expect(result.action).toBe('continue')
    if (result.action === 'continue') {
      expect(result.request.headers['x-target']).toEqual({ value: 'hello' })
    }
  })

  it('does nothing if source header is missing', () => {
    const fn = copyHeader('X-Missing', 'X-Target')
    const req = makeRequest({})
    const result = fn(req)
    expect(result).toEqual({ action: 'continue', request: req })
  })

  it('uses lowercase keys for both headers', () => {
    const fn = copyHeader('Content-Type', 'X-Original-Content-Type')
    const result = fn(makeRequest({ 'content-type': { value: 'text/html' } }))
    if (result.action === 'continue') {
      expect(result.request.headers['x-original-content-type'].value).toBe('text/html')
    }
  })
})
