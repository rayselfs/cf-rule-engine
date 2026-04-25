import { describe, it, expect } from 'vitest'
import { constructResponse } from '../../src/behaviors/construct-response.js'

const baseRequest = {
  uri: '/',
  method: 'GET',
  protocol: 'https',
  querystring: {},
  headers: {},
  clientIp: '1.2.3.4',
}

describe('constructResponse', () => {
  it('returns respond action with statusCode and no-store', () => {
    const fn = constructResponse({ statusCode: 200 })
    const result = fn(baseRequest)
    expect(result.action).toBe('respond')
    if (result.action === 'respond') {
      expect(result.response.statusCode).toBe(200)
      expect(result.response.statusDescription).toBe('OK')
      expect(result.response.headers['cache-control'].value).toBe('no-store')
    }
  })

  it('sets content-type when provided', () => {
    const fn = constructResponse({ statusCode: 200, contentType: 'text/plain' })
    const result = fn(baseRequest)
    if (result.action === 'respond') {
      expect(result.response.headers['content-type'].value).toBe('text/plain')
    }
  })

  it('sets body when provided', () => {
    const fn = constructResponse({ statusCode: 200, body: 'hello' })
    const result = fn(baseRequest)
    if (result.action === 'respond') {
      expect(result.response.body).toBe('hello')
    }
  })

  it('merges extra headers', () => {
    const fn = constructResponse({ statusCode: 403, headers: { 'X-Custom': 'value' } })
    const result = fn(baseRequest)
    if (result.action === 'respond') {
      expect(result.response.headers['x-custom'].value).toBe('value')
    }
  })

  it('knows all standard status descriptions', () => {
    const cases: Array<[number, string]> = [
      [204, 'No Content'],
      [400, 'Bad Request'],
      [401, 'Unauthorized'],
      [403, 'Forbidden'],
      [404, 'Not Found'],
      [405, 'Method Not Allowed'],
      [429, 'Too Many Requests'],
      [500, 'Internal Server Error'],
    ]
    for (const [code, desc] of cases) {
      const fn = constructResponse({ statusCode: code })
      const result = fn(baseRequest)
      if (result.action === 'respond') {
        expect(result.response.statusDescription).toBe(desc)
      }
    }
  })
})
