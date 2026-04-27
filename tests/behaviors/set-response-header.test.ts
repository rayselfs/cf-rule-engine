import { describe, it, expect } from 'vitest'
import { setResponseHeader } from '../../src/behaviors/set-response-header.js'

const baseRequest = {
  uri: '/',
  method: 'GET',
  protocol: 'https',
  querystring: {},
  headers: {},
  clientIp: '1.2.3.4',
}

const baseResponse = {
  statusCode: 200,
  statusDescription: 'OK',
  headers: {},
}

describe('setResponseHeader', () => {
  it('sets a response header', () => {
    const fn = setResponseHeader('X-Custom', 'value')
    const result = fn(baseRequest, baseResponse)
    expect(result.headers['x-custom']).toEqual({ value: 'value' })
  })

  it('lowercases header name', () => {
    const fn = setResponseHeader('X-UPPER', 'v')
    const result = fn(baseRequest, baseResponse)
    expect(result.headers['x-upper']).toEqual({ value: 'v' })
    expect(result.headers['X-UPPER']).toBeUndefined()
  })

  it('preserves other headers', () => {
    const response = { ...baseResponse, headers: { 'content-type': { value: 'text/html' } } }
    const fn = setResponseHeader('x-new', 'v')
    const result = fn(baseRequest, response)
    expect(result.headers['content-type']).toEqual({ value: 'text/html' })
    expect(result.headers['x-new']).toEqual({ value: 'v' })
  })
})
