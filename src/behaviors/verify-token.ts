import { createHmac, timingSafeEqual } from 'crypto'
import type { BehaviorFn, HttpRequest } from '../core/types.js'
import { matchesWildcard } from '../shared/wildcard.js'

/**
 * ⚠️  Lambda@Edge only — CF Functions do not have the Node.js `crypto` module.
 *
 * Token format: `exp=<unix>~acl=<path>~hmac=<hex>`
 * The `key` is the hex-encoded HMAC-SHA256 secret (Akamai `verifyTokenAuthorization.key`).
 */
export type VerifyTokenOptions = {
  key: string
  param?: string
  escapeEarly?: boolean
  ignoreQueryString?: boolean
  failureStatus?: 401 | 403
}

type ParsedToken = {
  fields: Record<string, string>
  signedParts: string[]
}

function parseToken(raw: string): ParsedToken | null {
  const fields: Record<string, string> = {}
  const signedParts: string[] = []
  const parts = raw.split('~')
  for (let i = 0; i < parts.length; i++) {
    const eq = parts[i].indexOf('=')
    if (eq === -1) return null
    const k = parts[i].slice(0, eq)
    if (!k) return null
    fields[k] = parts[i].slice(eq + 1)
    if (k !== 'hmac') signedParts.push(parts[i])
  }
  return { fields, signedParts }
}

function escapeEarly(text: string): string {
  return encodeURIComponent(text)
    .replace(/%20/g, '+')
    .replace(/[!'()*]/g, function(c) { return '%' + c.charCodeAt(0).toString(16) })
    .replace(/%[0-9A-F]{2}/g, function(c) { return c.toLowerCase() })
}

function requestPath(request: HttpRequest, ignoreQueryString: boolean, tokenParam: string): string {
  if (ignoreQueryString) return request.uri
  const entries = Object.entries(request.querystring)
  const query: string[] = []
  for (let i = 0; i < entries.length; i++) {
    if (entries[i][0] !== tokenParam) query.push(entries[i][0] + '=' + entries[i][1].value)
  }
  return query.length ? request.uri + '?' + query.join('&') : request.uri
}

function verifyHmac(parsed: ParsedToken, keyHex: string, signedPath: string): boolean {
  var hmacVal = parsed.fields['hmac']
  if (!hmacVal) return false
  const signedParts = parsed.signedParts.slice()
  if (!parsed.fields['acl'] && !parsed.fields['url']) signedParts.push('url=' + signedPath)
  var message = signedParts.join('~')
  let keyBytes: Buffer
  try { keyBytes = Buffer.from(keyHex, 'hex') } catch { return false }
  const expected = createHmac('sha256', keyBytes).update(message).digest()
  let actual: Buffer
  try { actual = Buffer.from(hmacVal, 'hex') } catch { return false }
  if (expected.length !== actual.length) return false
  return timingSafeEqual(expected, actual) // timing-safe: prevents HMAC oracle attacks
}

function matchesAcl(uri: string, acl: string): boolean {
  const patterns = acl.split('!')
  for (let i = 0; i < patterns.length; i++) {
    if (matchesWildcard(uri, patterns[i])) return true
  }
  return false
}

/**
 * Validates an Akamai Edge Auth Token 2.0 (HMAC-SHA256) from the request querystring.
 * Returns 403 on missing / expired / invalid token; continues on success.
 * Chain with `stripQueryParams([param])` to strip the token before forwarding to origin.
 *
 * ⚠️  Lambda@Edge only.
 *
 * @example
 * ```ts
 * export const handler = defineViewerRequest([
 *   rule(verifyToken({ key: process.env.EDGE_AUTH_KEY! })),
 *   rule(stripQueryParams(['hdnts'])),
 * ])
 * ```
 */
export function verifyToken(options: VerifyTokenOptions): BehaviorFn {
  const param = options.param ?? 'hdnts'
  const ignoreQueryString = options.ignoreQueryString ?? true
  const failureStatus = options.failureStatus ?? 403
  const statusDescription = failureStatus === 401 ? 'Unauthorized' : 'Forbidden'

  const deny = (): ReturnType<BehaviorFn> => ({
    action: 'respond',
    response: {
      statusCode: failureStatus,
      statusDescription,
      headers: { 'cache-control': { value: 'no-store' } },
    },
  })

  return (request: HttpRequest): ReturnType<BehaviorFn> => {
    const tokenEntry = request.querystring[param]
    if (!tokenEntry?.value) return deny()

    const parsed = parseToken(tokenEntry.value)
    if (!parsed) return deny()
    const fields = parsed.fields

    const expStr = fields['exp']
    if (expStr) {
      const exp = parseInt(expStr, 10)
      if (isNaN(exp) || Math.floor(Date.now() / 1000) > exp) return deny()
    }

    const stStr = fields['st']
    if (stStr) {
      const st = parseInt(stStr, 10)
      if (isNaN(st) || Math.floor(Date.now() / 1000) < st) return deny()
    }

    if (fields['acl'] && !matchesAcl(request.uri, fields['acl'])) return deny()

    const path = requestPath(request, ignoreQueryString, param)
    const signedPath = options.escapeEarly ? escapeEarly(path) : path
    if (fields['url'] && fields['url'] !== signedPath) return deny()
    if (!verifyHmac(parsed, options.key, signedPath)) return deny()

    return { action: 'continue', request }
  }
}
