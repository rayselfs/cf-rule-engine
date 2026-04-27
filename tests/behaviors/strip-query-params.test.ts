import { describe, it, expect } from 'vitest'
import { stripQueryParams } from '../../src/behaviors/strip-query-params.js'

const makeRequest = (querystring: Record<string, { value: string }>) => ({
  uri: '/',
  method: 'GET',
  protocol: 'https',
  querystring,
  headers: {},
  clientIp: '1.2.3.4',
})

describe('stripQueryParams', () => {
  it('removes specified query params', () => {
    const fn = stripQueryParams('utm_source', 'utm_medium')
    const result = fn(makeRequest({ utm_source: { value: 'google' }, utm_medium: { value: 'cpc' }, foo: { value: 'bar' } }))
    expect(result.action).toBe('continue')
    if (result.action === 'continue') {
      expect(result.request.querystring['utm_source']).toBeUndefined()
      expect(result.request.querystring['utm_medium']).toBeUndefined()
      expect(result.request.querystring['foo']).toEqual({ value: 'bar' })
    }
  })

  it('is a no-op when params not present', () => {
    const fn = stripQueryParams('missing')
    const qs = { foo: { value: 'bar' } }
    const result = fn(makeRequest(qs))
    if (result.action === 'continue') {
      expect(result.request.querystring).toEqual(qs)
    }
  })
})
