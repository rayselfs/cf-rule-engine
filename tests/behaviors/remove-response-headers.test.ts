import { describe, it, expect } from 'vitest'
import { removeResponseHeaders } from '../../src/behaviors/remove-response-headers.js'

const baseRequest = {
  uri: '/',
  method: 'GET',
  protocol: 'https',
  querystring: {},
  headers: {},
  clientIp: '1.2.3.4',
}

describe('removeResponseHeaders', () => {
  it('removes specified headers', () => {
    const response = {
      statusCode: 200,
      headers: {
        'x-powered-by': { value: 'Express' },
        'server': { value: 'nginx' },
        'content-type': { value: 'text/html' },
      },
    }
    const fn = removeResponseHeaders('X-Powered-By', 'Server')
    const result = fn(baseRequest, response)
    expect(result.headers['x-powered-by']).toBeUndefined()
    expect(result.headers['server']).toBeUndefined()
    expect(result.headers['content-type']).toEqual({ value: 'text/html' })
  })

  it('is a no-op for missing headers', () => {
    const response = { statusCode: 200, headers: { 'content-type': { value: 'text/html' } } }
    const fn = removeResponseHeaders('x-missing')
    const result = fn(baseRequest, response)
    expect(result.headers).toEqual({ 'content-type': { value: 'text/html' } })
  })
})
