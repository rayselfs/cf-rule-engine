import type { ResponseRule } from '../core/types.js'
import { headerEquals } from '../criteria/header-equals.js'
import { setResponseHeader } from '../behaviors/set-response-header.js'

const STAGING_REQUEST_HEADER = 'aws-cf-cd-staging'
const STAGING_RESPONSE_HEADER = 'x-cf-distribution'
const STAGING_RESPONSE_VALUE = 'staging'

/**
 * Returns a `ResponseRule` that adds `x-cf-distribution: staging` to the response
 * when the request carries the `aws-cf-cd-staging: true` header.
 *
 * This allows clients (DevTools, curl) to confirm they are hitting a staging
 * CloudFront distribution without modifying origin behaviour.
 *
 * **Usage**: Add to `defineViewerResponse` in any `viewer-response` config that is
 * shared between the primary and staging distributions. Requests to the primary
 * distribution do not carry `aws-cf-cd-staging`, so the rule is a no-op there.
 *
 * @returns A `ResponseRule` ready to pass into `defineViewerResponse`.
 *
 * @example
 * ```ts
 * import { setCorsHeaders } from '@rayselfs/cf-rule-engine/behaviors'
 * import { stagingIndicator } from '@rayselfs/cf-rule-engine/helpers'
 * import { defineViewerResponse } from '@rayselfs/cf-rule-engine/adapters/cf-function'
 *
 * export default defineViewerResponse([
 *   setCorsHeaders({ allowedOrigins: ['https://www.example.com'] }),
 *   stagingIndicator(),
 * ])
 * ```
 */
export function stagingIndicator(): ResponseRule {
  return {
    criteria: headerEquals(STAGING_REQUEST_HEADER, ['true']),
    behavior: setResponseHeader(STAGING_RESPONSE_HEADER, STAGING_RESPONSE_VALUE),
  }
}
