import { describe, it, expect } from 'vitest'
import { stagingIndicator } from '../../src/helpers/staging-indicator.js'

const makeRequest = (headers: Record<string, { value: string }> = {}) => ({
  uri: '/',
  method: 'GET',
  protocol: 'https',
  querystring: {},
  headers,
  clientIp: '1.2.3.4',
})

const baseResponse = { statusCode: 200, headers: {} }

describe('stagingIndicator', () => {
  it('adds x-cf-distribution: staging when aws-cf-cd-staging is true', () => {
    const rule = stagingIndicator()
    const req = makeRequest({ 'aws-cf-cd-staging': { value: 'true' } })
    expect(rule.criteria!(req)).toBe(true)
    const result = rule.behavior(req, baseResponse)
    expect(result.headers['x-cf-distribution']).toEqual({ value: 'staging' })
  })

  it('does not add header when aws-cf-cd-staging is absent', () => {
    const rule = stagingIndicator()
    const req = makeRequest({})
    expect(rule.criteria!(req)).toBe(false)
  })

  it('does not add header when aws-cf-cd-staging has a different value', () => {
    const rule = stagingIndicator()
    const req = makeRequest({ 'aws-cf-cd-staging': { value: 'false' } })
    expect(rule.criteria!(req)).toBe(false)
  })

  it('preserves existing response headers', () => {
    const rule = stagingIndicator()
    const req = makeRequest({ 'aws-cf-cd-staging': { value: 'true' } })
    const response = { statusCode: 200, headers: { 'content-type': { value: 'text/html' } } }
    const result = rule.behavior(req, response)
    expect(result.headers['content-type']).toEqual({ value: 'text/html' })
    expect(result.headers['x-cf-distribution']).toEqual({ value: 'staging' })
  })
})
