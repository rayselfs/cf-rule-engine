import { describe, it, expect } from 'vitest'
import { defineViewerRequest, defineViewerResponse } from '../../src/adapters/lambda-edge.js'
import { rule } from '../../src/core/rule.js'
import { redirect } from '../../src/behaviors/redirect.js'

const makeLambdaRequestEvent = (reqOverrides: Record<string, unknown> = {}) => ({
  Records: [{
    cf: {
      config: { eventType: 'viewer-request' },
      request: {
        uri: '/test',
        method: 'GET',
        clientIp: '1.2.3.4',
        querystring: '',
        headers: {
          host: [{ key: 'Host', value: 'example.com' }],
        },
        ...reqOverrides,
      },
    },
  }],
})

describe('defineViewerRequest (Lambda@Edge)', () => {
  it('returns redirect response with string status when rule triggers', async () => {
    const handler = defineViewerRequest([rule(redirect(302, '/new'))])
    const event = makeLambdaRequestEvent()
    const result = await (handler(event) as Promise<Record<string, unknown>>)
    expect(result.status).toBe('302')
    const headers = result.headers as Record<string, Array<{ key: string; value: string }>>
    expect(headers.location[0].value).toBe('/new')
  })

  it('returns request (pass-through) when no rules match', async () => {
    const handler = defineViewerRequest([
      rule((req) => req.uri === '/no-match', redirect(302, '/new')),
    ])
    const event = makeLambdaRequestEvent()
    const result = await (handler(event) as Promise<Record<string, unknown>>)
    expect(result.uri).toBe('/test')
    expect(result.status).toBeUndefined()
  })

  it('passes clientIp from request', async () => {
    let capturedIp = ''
    const handler = defineViewerRequest([
      rule((req) => { capturedIp = req.clientIp; return { action: 'continue', request: req } }),
    ])
    await (handler(makeLambdaRequestEvent()) as Promise<unknown>)
    expect(capturedIp).toBe('1.2.3.4')
  })

  it('parses querystring to object format', async () => {
    let capturedQs: Record<string, { value: string }> = {}
    const handler = defineViewerRequest([
      rule((req) => { capturedQs = req.querystring; return { action: 'continue', request: req } }),
    ])
    await (handler(makeLambdaRequestEvent({ querystring: 'foo=bar&baz=qux' })) as Promise<unknown>)
    expect(capturedQs).toEqual({ foo: { value: 'bar' }, baz: { value: 'qux' } })
  })

  it('normalizes array headers to flat format', async () => {
    let capturedHeaders: Record<string, { value: string }> = {}
    const handler = defineViewerRequest([
      rule((req) => { capturedHeaders = req.headers; return { action: 'continue', request: req } }),
    ])
    await (handler(makeLambdaRequestEvent()) as Promise<unknown>)
    expect(capturedHeaders.host.value).toBe('example.com')
  })
})

describe('defineViewerResponse (Lambda@Edge)', () => {
  const makeLambdaResponseEvent = () => ({
    Records: [{
      cf: {
        config: { eventType: 'viewer-response' },
        request: {
          uri: '/test',
          method: 'GET',
          clientIp: '1.2.3.4',
          querystring: '',
          headers: {
            host: [{ key: 'Host', value: 'example.com' }],
          },
        },
        response: {
          status: '200',
          statusDescription: 'OK',
          headers: {
            'content-type': [{ key: 'Content-Type', value: 'text/html' }],
          },
        },
      },
    }],
  })

  it('applies response behaviors', async () => {
    const handler = defineViewerResponse([
      (req, res) => ({ ...res, headers: { ...res.headers, 'x-custom': { value: 'added' } } }),
    ])
    const result = await (handler(makeLambdaResponseEvent()) as Promise<Record<string, unknown>>)
    const headers = result.headers as Record<string, Array<{ key: string; value: string }>>
    expect(headers['x-custom'][0].value).toBe('added')
    expect(headers['content-type'][0].value).toBe('text/html')
  })

  it('preserves status as string', async () => {
    const handler = defineViewerResponse([])
    const result = await (handler(makeLambdaResponseEvent()) as Promise<Record<string, unknown>>)
    expect(result.status).toBe('200')
  })
})
