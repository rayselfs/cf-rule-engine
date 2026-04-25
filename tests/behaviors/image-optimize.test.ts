import { describe, it, expect } from 'vitest'
import { imageOptimize } from '../../src/behaviors/image-optimize.js'

const makeRequest = (uri: string, headers: Record<string, { value: string }> = {}, querystring: Record<string, { value: string }> = {}) => ({
  uri,
  method: 'GET',
  protocol: 'https',
  querystring,
  headers,
  clientIp: '1.2.3.4',
})

const defaultOptions = {
  breakpoints: [320, 640, 1024, 2048],
  quality: 85,
  serviceEndpoint: '/imgproxy',
  sourceBaseUrl: 'https://origin.example.com',
}

describe('imageOptimize', () => {
  it('rewrites URI with avif format and ceiling breakpoint', () => {
    const fn = imageOptimize(defaultOptions)
    const result = fn(makeRequest('/images/photo.jpg', {
      accept: { value: 'image/avif,image/webp,image/*' },
      'cloudfront-viewer-width': { value: '800' },
    }))
    expect(result.action).toBe('continue')
    if (result.action === 'continue') {
      expect(result.request.uri).toBe(
        '/imgproxy/rs:fit:1024/f:avif/q:85/plain/https://origin.example.com/images/photo.jpg'
      )
    }
  })

  it('selects 640 breakpoint for width 500 with breakpoints [320,640,1024]', () => {
    const fn = imageOptimize({ ...defaultOptions, breakpoints: [320, 640, 1024] })
    const result = fn(makeRequest('/img.jpg', {
      accept: { value: 'image/webp' },
      'cloudfront-viewer-width': { value: '500' },
    }))
    if (result.action === 'continue') {
      expect(result.request.uri).toContain('rs:fit:640')
    }
  })

  it('uses largest breakpoint when CloudFront-Viewer-Width is missing', () => {
    const fn = imageOptimize(defaultOptions)
    const result = fn(makeRequest('/img.jpg', { accept: { value: 'image/webp' } }))
    if (result.action === 'continue') {
      expect(result.request.uri).toContain('rs:fit:2048')
    }
  })

  it('uses webp when Accept has webp but not avif', () => {
    const fn = imageOptimize(defaultOptions)
    const result = fn(makeRequest('/img.jpg', {
      accept: { value: 'image/webp,image/*' },
      'cloudfront-viewer-width': { value: '320' },
    }))
    if (result.action === 'continue') {
      expect(result.request.uri).toContain('f:webp')
    }
  })

  it('uses jpeg when Accept has no avif or webp', () => {
    const fn = imageOptimize(defaultOptions)
    const result = fn(makeRequest('/img.jpg', {
      accept: { value: 'image/*' },
      'cloudfront-viewer-width': { value: '320' },
    }))
    if (result.action === 'continue') {
      expect(result.request.uri).toContain('f:jpeg')
    }
  })

  it('uses largest breakpoint when width exceeds all breakpoints', () => {
    const fn = imageOptimize(defaultOptions)
    const result = fn(makeRequest('/img.jpg', {
      accept: { value: 'image/avif' },
      'cloudfront-viewer-width': { value: '9999' },
    }))
    if (result.action === 'continue') {
      expect(result.request.uri).toContain('rs:fit:2048')
    }
  })

  it('uses imwidth query param to select ceiling breakpoint', () => {
    const fn = imageOptimize({ ...defaultOptions, breakpoints: [320, 640, 1024] })
    const result = fn(makeRequest('/img.jpg', { accept: { value: 'image/webp' } }, { imwidth: { value: '500' } }))
    if (result.action === 'continue') {
      expect(result.request.uri).toContain('rs:fit:640')
    }
  })

  it('uses imformat=chrome query param to select webp format', () => {
    const fn = imageOptimize(defaultOptions)
    const result = fn(makeRequest('/img.jpg', { accept: { value: 'image/*' } }, { imformat: { value: 'chrome' } }))
    if (result.action === 'continue') {
      expect(result.request.uri).toContain('f:webp')
    }
  })

  it('uses imformat=generic query param to select jpeg format', () => {
    const fn = imageOptimize(defaultOptions)
    const result = fn(makeRequest('/img.jpg', { accept: { value: 'image/avif' } }, { imformat: { value: 'generic' } }))
    if (result.action === 'continue') {
      expect(result.request.uri).toContain('f:jpeg')
    }
  })
})
