import { describe, it, expect } from 'vitest'
import { fileExtension } from '../../src/criteria/file-extension.js'
import type { HttpRequest } from '../../src/core/types.js'

const req = (uri: string): HttpRequest => ({
  uri, method: 'GET', protocol: 'https', querystring: {}, headers: {}, clientIp: '1.1.1.1'
})

describe('fileExtension', () => {
  it('returns true for matching extension', () => {
    expect(fileExtension('js')(req('/app.js'))).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(fileExtension('js')(req('/app.JS'))).toBe(true)
  })

  it('returns false for non-matching extension', () => {
    expect(fileExtension('js')(req('/app.css'))).toBe(false)
  })

  it('strips querystring before extracting extension', () => {
    expect(fileExtension('js')(req('/app.js?v=1'))).toBe(true)
  })

  it('returns false when no extension', () => {
    expect(fileExtension('js')(req('/about'))).toBe(false)
  })

  it('supports multiple extensions', () => {
    const fn = fileExtension('js', 'css', 'png')
    expect(fn(req('/style.css'))).toBe(true)
    expect(fn(req('/page.html'))).toBe(false)
  })
})
