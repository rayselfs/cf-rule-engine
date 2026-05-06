import { describe, it, expect } from 'vitest'
import { sendCountryCode } from '../../src/helpers/send-country-code.js'

const makeRequest = (headers: Record<string, { value: string }>) => ({
  uri: '/',
  method: 'GET',
  protocol: 'https',
  querystring: {},
  headers,
  clientIp: '1.2.3.4',
})

describe('sendCountryCode', () => {
  it('copies CloudFront-Viewer-Country to x-htc-request-country-code by default', () => {
    const fn = sendCountryCode()
    const result = fn(makeRequest({ 'cloudfront-viewer-country': { value: 'TW' } }))
    expect(result.action).toBe('continue')
    if (result.action === 'continue') {
      expect(result.request.headers['x-htc-request-country-code']).toEqual({ value: 'TW' })
    }
  })

  it('uses custom target header when provided', () => {
    const fn = sendCountryCode('x-custom-country')
    const result = fn(makeRequest({ 'cloudfront-viewer-country': { value: 'US' } }))
    if (result.action === 'continue') {
      expect(result.request.headers['x-custom-country']).toEqual({ value: 'US' })
    }
  })

  it('does nothing if CloudFront-Viewer-Country is missing', () => {
    const fn = sendCountryCode()
    const req = makeRequest({})
    const result = fn(req)
    expect(result).toEqual({ action: 'continue', request: req })
  })

  it('handles different country codes', () => {
    const fn = sendCountryCode()
    const countryCodes = ['JP', 'KR', 'CN', 'SG', 'AU']
    for (let i = 0; i < countryCodes.length; i = i + 1) {
      const code = countryCodes[i]
      const result = fn(makeRequest({ 'cloudfront-viewer-country': { value: code } }))
      if (result.action === 'continue') {
        expect(result.request.headers['x-htc-request-country-code'].value).toBe(code)
      }
    }
  })
})
