import { describe, it, expect } from 'vitest'
import { directoryIndex } from '../../src/behaviors/directory-index.js'

const makeRequest = (uri: string) => ({
  uri,
  method: 'GET',
  protocol: 'https',
  querystring: {},
  headers: {},
  clientIp: '1.2.3.4',
})

describe('directoryIndex', () => {
  it('rewrites /foo/ to /foo/index.html', () => {
    const fn = directoryIndex('index.html')
    const result = fn(makeRequest('/foo/'))
    expect(result).toEqual({ action: 'continue', request: { ...makeRequest('/foo/'), uri: '/foo/index.html' } })
  })

  it('redirects /foo/index.html to /foo/', () => {
    const fn = directoryIndex('index.html')
    const result = fn(makeRequest('/foo/index.html'))
    expect(result.action).toBe('respond')
    if (result.action === 'respond') {
      expect(result.response.statusCode).toBe(301)
      expect(result.response.headers['location'].value).toBe('/foo/')
    }
  })

  it('redirects extensionless path to path with trailing slash', () => {
    const fn = directoryIndex()
    const result = fn(makeRequest('/foo/bar'))
    expect(result.action).toBe('respond')
    if (result.action === 'respond') {
      expect(result.response.headers['location'].value).toBe('/foo/bar/')
    }
  })

  it('passes through paths with extension unchanged', () => {
    const fn = directoryIndex()
    const result = fn(makeRequest('/foo/bar.jpg'))
    expect(result).toEqual({ action: 'continue', request: makeRequest('/foo/bar.jpg') })
  })

  it('uses custom index file', () => {
    const fn = directoryIndex('default.html')
    const result = fn(makeRequest('/foo/'))
    if (result.action === 'continue') {
      expect(result.request.uri).toBe('/foo/default.html')
    }
  })

  it('redirects /default.html (custom) to /', () => {
    const fn = directoryIndex('default.html')
    const result = fn(makeRequest('/default.html'))
    if (result.action === 'respond') {
      expect(result.response.headers['location'].value).toBe('/')
    }
  })
})
