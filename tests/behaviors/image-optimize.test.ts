import { describe, it, expect } from 'vitest'
import { imageOptimize, resolveImageParams } from '../../src/behaviors/image-optimize.js'

const makeRequest = (
  uri: string,
  headers: Record<string, { value: string }> = {},
  querystring: Record<string, { value: string }> = {},
) => ({
  uri,
  method: 'GET',
  protocol: 'https',
  querystring,
  headers,
  clientIp: '1.2.3.4',
})

const defaultOptions = {
  breakpoints: [320, 640, 1024, 2048],
  quality: 75,
}

describe('resolveImageParams', () => {
  it('snaps width to ceiling breakpoint from CloudFront-Viewer-Width', () => {
    const result = resolveImageParams(
      makeRequest('/img.jpg', { 'cloudfront-viewer-width': { value: '800' } }),
      defaultOptions,
    )
    expect(result.breakpoint).toBe(1024)
  })

  it('snaps width to ceiling breakpoint from imwidth query param', () => {
    const result = resolveImageParams(
      makeRequest('/img.jpg', {}, { imwidth: { value: '500' } }),
      { ...defaultOptions, breakpoints: [320, 640, 1024] },
    )
    expect(result.breakpoint).toBe(640)
  })

  it('prefers imwidth param over CloudFront-Viewer-Width header', () => {
    const result = resolveImageParams(
      makeRequest(
        '/img.jpg',
        { 'cloudfront-viewer-width': { value: '900' } },
        { imwidth: { value: '300' } },
      ),
      defaultOptions,
    )
    expect(result.breakpoint).toBe(320)
  })

  it('uses largest breakpoint when no width source is present', () => {
    const result = resolveImageParams(makeRequest('/img.jpg'), defaultOptions)
    expect(result.breakpoint).toBe(2048)
  })

  it('uses largest breakpoint when width exceeds all breakpoints', () => {
    const result = resolveImageParams(
      makeRequest('/img.jpg', { 'cloudfront-viewer-width': { value: '9999' } }),
      defaultOptions,
    )
    expect(result.breakpoint).toBe(2048)
  })

  it('selects avif from Accept header when listed first', () => {
    const result = resolveImageParams(
      makeRequest('/img.jpg', { accept: { value: 'image/avif,image/webp' } }),
      defaultOptions,
    )
    expect(result.format).toBe('avif')
  })

  it('selects webp when Accept has webp but not avif', () => {
    const result = resolveImageParams(
      makeRequest('/img.jpg', { accept: { value: 'image/webp,image/*' } }),
      defaultOptions,
    )
    expect(result.format).toBe('webp')
  })

  it('falls back to jpeg when Accept has no avif or webp', () => {
    const result = resolveImageParams(
      makeRequest('/img.jpg', { accept: { value: 'image/*' } }),
      defaultOptions,
    )
    expect(result.format).toBe('jpeg')
  })

  it('maps imformat=chrome to webp', () => {
    const result = resolveImageParams(
      makeRequest('/img.jpg', { accept: { value: 'image/avif' } }, { imformat: { value: 'chrome' } }),
      defaultOptions,
    )
    expect(result.format).toBe('webp')
  })

  it('maps imformat=avif to avif', () => {
    const result = resolveImageParams(
      makeRequest('/img.jpg', {}, { imformat: { value: 'avif' } }),
      defaultOptions,
    )
    expect(result.format).toBe('avif')
  })

  it('maps imformat=generic to jpeg', () => {
    const result = resolveImageParams(
      makeRequest('/img.jpg', { accept: { value: 'image/avif' } }, { imformat: { value: 'generic' } }),
      defaultOptions,
    )
    expect(result.format).toBe('jpeg')
  })

  it('returns default quality 75', () => {
    const result = resolveImageParams(makeRequest('/img.jpg'), defaultOptions)
    expect(result.quality).toBe(75)
  })
})

describe('imageOptimize', () => {
  it('writes normalized imwidth, f, q to querystring', () => {
    const fn = imageOptimize(defaultOptions)
    const result = fn(makeRequest(
      '/img.jpg',
      { accept: { value: 'image/avif' }, 'cloudfront-viewer-width': { value: '800' } },
    ))
    expect(result.action).toBe('continue')
    if (result.action === 'continue') {
      const qs = result.request.querystring
      expect(qs['imwidth']?.value).toBe('1024')
      expect(qs['f']?.value).toBe('avif')
      expect(qs['q']?.value).toBe('75')
    }
  })

  it('does not modify uri', () => {
    const fn = imageOptimize(defaultOptions)
    const result = fn(makeRequest('/images/photo.jpg', { accept: { value: 'image/webp' } }))
    if (result.action === 'continue') {
      expect(result.request.uri).toBe('/images/photo.jpg')
    }
  })

  it('removes imformat from querystring after translating to f', () => {
    const fn = imageOptimize(defaultOptions)
    const result = fn(makeRequest('/img.jpg', {}, { imformat: { value: 'chrome' } }))
    if (result.action === 'continue') {
      const qs = result.request.querystring
      expect(qs['imformat']).toBeUndefined()
      expect(qs['f']?.value).toBe('webp')
    }
  })

  it('does not overwrite q param if already set', () => {
    const fn = imageOptimize(defaultOptions)
    const result = fn(makeRequest('/img.jpg', {}, { q: { value: '50' } }))
    if (result.action === 'continue') {
      expect(result.request.querystring['q']?.value).toBe('50')
    }
  })

  it('converts legacy quality param to q and removes quality from querystring', () => {
    const fn = imageOptimize(defaultOptions)
    const result = fn(makeRequest('/img.jpg', {}, { quality: { value: '60' } }))
    if (result.action === 'continue') {
      expect(result.request.querystring['q']?.value).toBe('60')
      expect(result.request.querystring['quality']).toBeUndefined()
    }
  })

  it('preserves unrelated querystring params', () => {
    const fn = imageOptimize(defaultOptions)
    const result = fn(makeRequest('/img.jpg', {}, { v: { value: '2' }, foo: { value: 'bar' } }))
    if (result.action === 'continue') {
      const qs = result.request.querystring
      expect(qs['v']?.value).toBe('2')
      expect(qs['foo']?.value).toBe('bar')
    }
  })

  it('respects custom imwidthParam option', () => {
    const fn = imageOptimize({ ...defaultOptions, imwidthParam: 'w' })
    const result = fn(makeRequest('/img.jpg', {}, { w: { value: '400' } }))
    if (result.action === 'continue') {
      expect(result.request.querystring['imwidth']?.value).toBe('640')
    }
  })

  it('injects x-img-source-type and x-img-upstream-gateway for gateway origin', () => {
    const fn = imageOptimize({
      ...defaultOptions,
      origin: { type: 'gateway', upstreamGateway: 'image-proxy.internal.example.com:8080' },
    })
    const result = fn(makeRequest('/img.jpg'))
    if (result.action === 'continue') {
      expect(result.request.headers['x-img-source-type']?.value).toBe('gateway')
      expect(result.request.headers['x-img-upstream-gateway']?.value).toBe('image-proxy.internal.example.com:8080')
      expect(result.request.headers['x-img-source-bucket']).toBeUndefined()
    }
  })

  it('injects x-img-source-type and x-img-source-bucket for s3 origin', () => {
    const fn = imageOptimize({
      ...defaultOptions,
      origin: { type: 's3', sourceBucket: 'my-images-bucket' },
    })
    const result = fn(makeRequest('/img.jpg'))
    if (result.action === 'continue') {
      expect(result.request.headers['x-img-source-type']?.value).toBe('s3')
      expect(result.request.headers['x-img-source-bucket']?.value).toBe('my-images-bucket')
      expect(result.request.headers['x-img-upstream-gateway']).toBeUndefined()
    }
  })

  it('does not inject origin headers when origin option is omitted', () => {
    const fn = imageOptimize(defaultOptions)
    const result = fn(makeRequest('/img.jpg'))
    if (result.action === 'continue') {
      expect(result.request.headers['x-img-source-type']).toBeUndefined()
      expect(result.request.headers['x-img-upstream-gateway']).toBeUndefined()
      expect(result.request.headers['x-img-source-bucket']).toBeUndefined()
    }
  })

  it('injects x-origin-verify header when originSecret is provided', () => {
    const fn = imageOptimize({ ...defaultOptions, originSecret: 'my-secret-token' })
    const result = fn(makeRequest('/img.jpg'))
    if (result.action === 'continue') {
      expect(result.request.headers['x-origin-verify']?.value).toBe('my-secret-token')
    }
  })

  it('does not inject x-origin-verify header when originSecret is omitted', () => {
    const fn = imageOptimize(defaultOptions)
    const result = fn(makeRequest('/img.jpg'))
    if (result.action === 'continue') {
      expect(result.request.headers['x-origin-verify']).toBeUndefined()
    }
  })
})
