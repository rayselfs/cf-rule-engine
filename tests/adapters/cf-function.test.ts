import { describe, it, expect } from 'vitest'
import { defineViewerRequest, defineViewerResponse } from '../../src/adapters/cf-function.js'
import { rule } from '../../src/core/rule.js'
import { redirect } from '../../src/behaviors/redirect.js'

const makeCfRequestEvent = (overrides: Record<string, unknown> = {}) => ({
  version: '1.0',
  context: { eventType: 'viewer-request' },
  viewer: { ip: '1.2.3.4' },
  request: {
    method: 'GET',
    uri: '/test',
    headers: { host: { value: 'example.com' } },
    querystring: {},
    cookies: {},
    ...overrides,
  },
})

describe('defineViewerRequest (CF Function)', () => {
  it('returns redirect response when rule triggers', () => {
    const handler = defineViewerRequest([rule(redirect(302, '/new'))])
    const event = makeCfRequestEvent()
    const result = handler(event) as Record<string, unknown>
    expect(result.statusCode).toBe(302)
    const headers = result.headers as Record<string, { value: string }>
    expect(headers.location.value).toBe('/new')
  })

  it('returns request (pass-through) when no rules match', () => {
    const handler = defineViewerRequest([
      rule((req) => req.uri === '/no-match', redirect(302, '/new')),
    ])
    const event = makeCfRequestEvent()
    const result = handler(event) as Record<string, unknown>
    expect(result.uri).toBe('/test')
    expect(result.method).toBe('GET')
    expect(result.statusCode).toBeUndefined()
  })

  it('passes clientIp from viewer.ip', () => {
    let capturedIp = ''
    const handler = defineViewerRequest([
      rule((req) => { capturedIp = req.clientIp; return { action: 'continue', request: req } }),
    ])
    handler(makeCfRequestEvent())
    expect(capturedIp).toBe('1.2.3.4')
  })

  it('reads country from cloudfront-viewer-country header', () => {
    let capturedCountry: string | undefined
    const handler = defineViewerRequest([
      rule((req) => { capturedCountry = req.country; return { action: 'continue', request: req } }),
    ])
    const event = makeCfRequestEvent({
      headers: {
        host: { value: 'example.com' },
        'cloudfront-viewer-country': { value: 'US' },
      },
    })
    handler(event)
    expect(capturedCountry).toBe('US')
  })
})

describe('defineViewerResponse (CF Function)', () => {
  const makeCfResponseEvent = () => ({
    version: '1.0',
    context: { eventType: 'viewer-response' },
    viewer: { ip: '1.2.3.4' },
    request: {
      method: 'GET',
      uri: '/test',
      headers: { host: { value: 'example.com' } },
      querystring: {},
      cookies: {},
    },
    response: {
      statusCode: 200,
      statusDescription: 'OK',
      headers: { 'content-type': { value: 'text/html' } },
      cookies: {},
    },
  })

  it('applies response behaviors', () => {
    const handler = defineViewerResponse([
      (req, res) => ({ ...res, headers: { ...res.headers, 'x-custom': { value: 'added' } } }),
    ])
    const result = handler(makeCfResponseEvent()) as Record<string, unknown>
    const headers = result.headers as Record<string, { value: string }>
    expect(headers['x-custom'].value).toBe('added')
    expect(headers['content-type'].value).toBe('text/html')
  })

  it('preserves statusCode from response', () => {
    const handler = defineViewerResponse([])
    const result = handler(makeCfResponseEvent()) as Record<string, unknown>
    expect(result.statusCode).toBe(200)
  })
})
