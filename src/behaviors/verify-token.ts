import { createHmac, timingSafeEqual } from 'crypto'
import type { BehaviorFn, HttpRequest } from '../core/types.js'

/**
 * ⚠️  Lambda@Edge only — CF Functions do not have the Node.js `crypto` module.
 *
 * Token format: `exp=<unix>~acl=<path>~hmac=<hex>`
 * The `key` is the hex-encoded HMAC-SHA256 secret (Akamai `verifyTokenAuthorization.key`).
 */
export interface VerifyTokenOptions {
  key: string
  param?: string
  failureStatus?: 401 | 403
}

function parseToken(raw: string): Record<string, string> | null {
  const fields: Record<string, string> = {}
  const parts = raw.split('~')
  for (let i = 0; i < parts.length; i++) {
    const eq = parts[i].indexOf('=')
    if (eq === -1) return null
    const k = parts[i].slice(0, eq)
    if (!k) return null
    fields[k] = parts[i].slice(eq + 1)
  }
  return fields
}

function verifyHmac(fields: Record<string, string>, keyHex: string): boolean {
  var hmacVal = fields['hmac']
  if (!hmacVal) return false
  var restKeys = Object.keys(fields).filter(function(k) { return k !== 'hmac' })
  var message = restKeys.map(function(k) { return k + '=' + fields[k] }).join('~')
  let keyBytes: Buffer
  try { keyBytes = Buffer.from(keyHex, 'hex') } catch { return false }
  const expected = createHmac('sha256', keyBytes).update(message).digest()
  let actual: Buffer
  try { actual = Buffer.from(hmacVal, 'hex') } catch { return false }
  if (expected.length !== actual.length) return false
  return timingSafeEqual(expected, actual) // timing-safe: prevents HMAC oracle attacks
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

    const fields = parseToken(tokenEntry.value)
    if (!fields) return deny()

    const expStr = fields['exp']
    if (expStr) {
      const exp = parseInt(expStr, 10)
      if (isNaN(exp) || Math.floor(Date.now() / 1000) > exp) return deny()
    }

    if (!verifyHmac(fields, options.key)) return deny()

    return { action: 'continue', request }
  }
}
