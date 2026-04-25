import { describe, it, expect } from 'vitest'
import { runRules, rule, all, not } from '../../src/core/rule.js'
import { ipCidr } from '../../src/criteria/ip-cidr.js'
import { pathMatches } from '../../src/criteria/path-matches.js'
import { pathEquals } from '../../src/criteria/path-equals.js'
import { userAgentMatches } from '../../src/criteria/user-agent-matches.js'
import { methodIs } from '../../src/criteria/method-is.js'
import { hostnameIs } from '../../src/criteria/hostname-is.js'
import { redirect } from '../../src/behaviors/redirect.js'
import { rewriteUri } from '../../src/behaviors/rewrite-uri.js'
import { constructResponse } from '../../src/behaviors/construct-response.js'
import { copyHeader } from '../../src/behaviors/copy-header.js'
import { setCorsHeaders } from '../../src/behaviors/set-cors-headers.js'
import { matchesWildcard } from '../../src/shared/wildcard.js'
import type { HttpRequest, HttpResponse, Rule, ResponseBehaviorFn } from '../../src/core/types.js'

function makeRequest(overrides: Partial<HttpRequest> & { uri: string }): HttpRequest {
  return {
    method: 'GET',
    protocol: 'https',
    querystring: {},
    headers: {},
    clientIp: '8.8.8.8',
    ...overrides,
  }
}

function makeResponse(overrides?: Partial<HttpResponse>): HttpResponse {
  return {
    statusCode: 200,
    headers: {},
    ...overrides,
  }
}

const applyResponseBehaviors = (
  behaviors: ResponseBehaviorFn[],
  req: HttpRequest,
  res: HttpResponse,
): HttpResponse => {
  let response = res
  for (const behavior of behaviors) {
    response = behavior(req, response)
  }
  return response
}

const STAGE_WHITELIST_IPS = [
  '61.218.44.76/32',
  '122.147.213.24/32',
  '60.251.61.121/32',
  '162.120.184.42/32',
  '175.98.157.254/32',
  '122.147.173.254/32',
  '52.33.9.56/32',
  '52.35.160.39/32',
  '50.112.203.191/32',
]

const viewerRequestRules: Rule[] = [
  rule(
    all(
      not(ipCidr(...STAGE_WHITELIST_IPS)),
      not(userAgentMatches('*HTCVRSDET*', '*Prerender*', '*HTC3PARTY*')),
      not(
        pathMatches(
          '/akamai/*',
          '/favicon.ico',
          '/rest/*',
          '/api/*',
          '/graphql*',
          '/management/*',
          '/polygon_file/*',
        ),
      ),
    ),
    redirect(302, 'https://stream.viverse.com/console'),
  ),

  rule(pathMatches('/metrics'), redirect(302, '/')),

  rule(pathEquals('/'), rewriteUri('set', '/console/landing')),

  rule(methodIs('OPTIONS'), constructResponse({ statusCode: 200, body: 'ok' })),

  rule(copyHeader('CloudFront-Viewer-Country', 'X-HTC-Request-Country-Code')),
]

const viewerResponseRules: { criteria?: (req: HttpRequest) => boolean; behavior: ResponseBehaviorFn }[] = [
  {
    criteria: all(
      hostnameIs('stream-stage.viverse.com'),
      (req) => matchesWildcard(req.headers['origin']?.value ?? '', 'https://*.viverse.com'),
    ),
    behavior: setCorsHeaders({
      allowOriginEcho: true,
      allowedOrigins: ['https://*.viverse.com'],
      allowedMethods: 'GET, POST, OPTIONS',
      allowedHeaders: 'Content-Type, Cache-Control, Pragma, Range',
    }),
  },

  {
    criteria: all(
      pathMatches(
        '/assets/downloads/*',
        '/assets/streamablemodel/*',
        '/demos/dinosaurs-107m/*',
        '/demos/jet/*',
        '/marketing/transparent-bg/*',
        '/polygon_file/*',
      ),
      (req) => !!req.headers['origin']?.value,
    ),
    behavior: setCorsHeaders({
      allowedOrigins: ['*'],
      allowedMethods: 'GET, POST, OPTIONS',
      allowedHeaders: 'Content-Type, Cache-Control, Pragma, Range',
    }),
  },
]

function runResponseRules(
  rules: typeof viewerResponseRules,
  req: HttpRequest,
  res: HttpResponse,
): HttpResponse {
  let response = res
  for (const r of rules) {
    if (!r.criteria || r.criteria(req)) {
      response = r.behavior(req, response)
    }
  }
  return response
}

describe('stream-stage viewer-request rules', () => {
  it('1. non-whitelisted IP with normal UA to /console → 302 to console URL', () => {
    const req = makeRequest({
      uri: '/console',
      clientIp: '8.8.8.8',
      headers: { 'user-agent': { value: 'Mozilla/5.0' } },
    })
    const result = runRules(viewerRequestRules, req)
    expect(result.action).toBe('respond')
    if (result.action === 'respond') {
      expect(result.response.statusCode).toBe(302)
      expect(result.response.headers['location']?.value).toBe('https://stream.viverse.com/console')
    }
  })

  it('2. whitelisted IP → passes through (rule 1 does not block)', () => {
    const req = makeRequest({
      uri: '/console',
      clientIp: '61.218.44.76',
      headers: { 'user-agent': { value: 'Mozilla/5.0' } },
    })
    const result = runRules(viewerRequestRules, req)
    expect(result.action).toBe('continue')
  })

  it('3. request to /metrics → 302 redirect to /', () => {
    const req = makeRequest({
      uri: '/metrics',
      clientIp: '61.218.44.76', // whitelisted so rule 1 doesn't fire
      headers: { 'user-agent': { value: 'Mozilla/5.0' } },
    })
    const result = runRules(viewerRequestRules, req)
    expect(result.action).toBe('respond')
    if (result.action === 'respond') {
      expect(result.response.statusCode).toBe(302)
      expect(result.response.headers['location']?.value).toBe('/')
    }
  })

  it('4. request to / → URI rewritten to /console/landing', () => {
    const req = makeRequest({
      uri: '/',
      clientIp: '61.218.44.76', // whitelisted so rule 1 doesn't fire
      headers: { 'user-agent': { value: 'Mozilla/5.0' } },
    })
    const result = runRules(viewerRequestRules, req)
    expect(result.action).toBe('continue')
    if (result.action === 'continue') {
      expect(result.request.uri).toBe('/console/landing')
    }
  })

  it('5. OPTIONS request → 200 response', () => {
    const req = makeRequest({
      uri: '/console',
      method: 'OPTIONS',
      clientIp: '61.218.44.76', // whitelisted so rule 1 doesn't fire
    })
    const result = runRules(viewerRequestRules, req)
    expect(result.action).toBe('respond')
    if (result.action === 'respond') {
      expect(result.response.statusCode).toBe(200)
    }
  })

  it('6. country header copied to X-HTC-Request-Country-Code on pass-through request', () => {
    const req = makeRequest({
      uri: '/console',
      clientIp: '61.218.44.76', // whitelisted
      headers: {
        'user-agent': { value: 'Mozilla/5.0' },
        'cloudfront-viewer-country': { value: 'TW' },
      },
    })
    const result = runRules(viewerRequestRules, req)
    expect(result.action).toBe('continue')
    if (result.action === 'continue') {
      expect(result.request.headers['x-htc-request-country-code']?.value).toBe('TW')
    }
  })
})

describe('stream-stage viewer-response rules', () => {
  it('7. response with origin https://www.viverse.com to stream-stage.viverse.com → echoes ACAO', () => {
    const req = makeRequest({
      uri: '/console',
      headers: {
        host: { value: 'stream-stage.viverse.com' },
        origin: { value: 'https://www.viverse.com' },
      },
    })
    const res = makeResponse()
    const response = runResponseRules(viewerResponseRules, req, res)
    expect(response.headers['access-control-allow-origin']?.value).toBe('https://www.viverse.com')
  })

  it('8. response to /assets/downloads/file.zip with any origin → ACAO: *', () => {
    const req = makeRequest({
      uri: '/assets/downloads/file.zip',
      headers: {
        host: { value: 'stream-stage.viverse.com' },
        origin: { value: 'https://example.com' },
      },
    })
    const res = makeResponse()
    const response = runResponseRules(viewerResponseRules, req, res)
    expect(response.headers['access-control-allow-origin']?.value).toBe('*')
  })

  it('9. response to other path without matching origin → no CORS headers added', () => {
    const req = makeRequest({
      uri: '/some/other/path',
      headers: {
        host: { value: 'other.example.com' },
      },
    })
    const res = makeResponse()
    const response = runResponseRules(viewerResponseRules, req, res)
    expect(response.headers['access-control-allow-origin']).toBeUndefined()
    expect(response.headers['access-control-allow-methods']).toBeUndefined()
  })
})
