import { describe, it, expect } from 'vitest'
import { setCacheControl } from '../../src/behaviors/set-cache-control.js'

const baseRequest = {
  uri: '/',
  method: 'GET',
  protocol: 'https',
  querystring: {},
  headers: {},
  clientIp: '1.2.3.4',
}

const baseResponse = { statusCode: 200, headers: {} }

describe('setCacheControl', () => {
  it('sets cache-control header on response', () => {
    const fn = setCacheControl('public, max-age=3600')
    const result = fn(baseRequest, baseResponse)
    expect(result.headers['cache-control']).toEqual({ value: 'public, max-age=3600' })
  })

  it('overwrites existing cache-control', () => {
    const response = { ...baseResponse, headers: { 'cache-control': { value: 'no-store' } } }
    const fn = setCacheControl('max-age=0')
    const result = fn(baseRequest, response)
    expect(result.headers['cache-control'].value).toBe('max-age=0')
  })
})
