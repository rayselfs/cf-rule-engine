import { describe, it, expect } from 'vitest'
import { rule, all, any, not, runRules } from '../../src/core/rule.js'
import type { HttpRequest, BehaviorResult } from '../../src/core/types.js'

const baseRequest: HttpRequest = {
  uri: '/test',
  method: 'GET',
  protocol: 'https',
  querystring: {},
  headers: {},
  clientIp: '1.2.3.4',
}

const makeRequest = (overrides: Partial<HttpRequest> = {}): HttpRequest => ({
  ...baseRequest,
  ...overrides,
})

describe('all()', () => {
  it('returns true when ALL criteria pass', () => {
    const fn = all([
      () => true,
      () => true,
      () => true,
    ])
    expect(fn(makeRequest())).toBe(true)
  })

  it('returns false if any criteria fails', () => {
    const fn = all([
      () => true,
      () => false,
      () => true,
    ])
    expect(fn(makeRequest())).toBe(false)
  })

  it('returns true for empty criteria list', () => {
    expect(all([])(makeRequest())).toBe(true)
  })
})

describe('any()', () => {
  it('returns true when at least one criteria passes', () => {
    const fn = any([
      () => false,
      () => true,
      () => false,
    ])
    expect(fn(makeRequest())).toBe(true)
  })

  it('returns false when all criteria fail', () => {
    const fn = any([
      () => false,
      () => false,
    ])
    expect(fn(makeRequest())).toBe(false)
  })

  it('returns false for empty criteria list', () => {
    expect(any([])(makeRequest())).toBe(false)
  })
})

describe('not()', () => {
  it('inverts true to false', () => {
    expect(not(() => true)(makeRequest())).toBe(false)
  })

  it('inverts false to true', () => {
    expect(not(() => false)(makeRequest())).toBe(true)
  })
})

describe('rule()', () => {
  it('without criteria: behavior always runs', () => {
    const req = makeRequest()
    const r = rule((request) => ({ action: 'continue', request }))
    expect(r.criteria).toBeUndefined()
    const result = r.behavior(req)
    expect(result.action).toBe('continue')
  })

  it('with criteria: behavior only runs when criteria matches', () => {
    const matchReq = makeRequest({ uri: '/match' })
    const noMatchReq = makeRequest({ uri: '/other' })
    const criteria = (req: HttpRequest) => req.uri === '/match'
    const r = rule(criteria, (request) => ({ action: 'continue', request }))

    expect(r.criteria!(matchReq)).toBe(true)
    expect(r.criteria!(noMatchReq)).toBe(false)
  })
})

describe('runRules()', () => {
  it('processes rules in order', () => {
    const order: number[] = []
    const rules = [
      rule((req) => { order.push(1); return { action: 'continue', request: req } }),
      rule((req) => { order.push(2); return { action: 'continue', request: req } }),
    ]
    runRules(rules, makeRequest())
    expect(order).toEqual([1, 2])
  })

  it('short-circuits on respond', () => {
    const order: number[] = []
    const rules = [
      rule((req) => {
        order.push(1)
        return {
          action: 'respond',
          response: { statusCode: 301, headers: {} },
        }
      }),
      rule((req) => { order.push(2); return { action: 'continue', request: req } }),
    ]
    const result = runRules(rules, makeRequest())
    expect(result.action).toBe('respond')
    expect(order).toEqual([1])
  })

  it('passes modified request through continue', () => {
    const rules = [
      rule((_req) => ({
        action: 'continue',
        request: makeRequest({ uri: '/modified' }),
      })),
      rule((req) => ({ action: 'continue', request: req })),
    ]
    const result = runRules(rules, makeRequest()) as { action: 'continue'; request: HttpRequest }
    expect(result.request.uri).toBe('/modified')
  })

  it('returns continue with final request when no rule responds', () => {
    const req = makeRequest()
    const rules = [
      rule((r) => ({ action: 'continue', request: r })),
    ]
    const result = runRules(rules, req)
    expect(result.action).toBe('continue')
  })

  it('skips rules where criteria does not match', () => {
    const order: number[] = []
    const rules = [
      rule(
        (req) => req.uri === '/no-match',
        (req) => { order.push(1); return { action: 'continue', request: req } },
      ),
      rule((req) => { order.push(2); return { action: 'continue', request: req } }),
    ]
    runRules(rules, makeRequest({ uri: '/other' }))
    expect(order).toEqual([2])
  })
})
