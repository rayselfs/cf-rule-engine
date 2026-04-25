import type { BehaviorFn } from '../core/types.js'
import { copyHeader } from '../behaviors/copy-header.js'

/**
 * Copies the `CloudFront-Viewer-Country` header value into a custom request header,
 * making the viewer's country code available to the origin server.
 *
 * CloudFront sets `CloudFront-Viewer-Country` to the ISO 3166-1 alpha-2 country code
 * of the viewer (e.g. `'US'`, `'TW'`, `'JP'`). This helper copies it to the header name
 * your origin expects, defaulting to `'x-viewer-country'`.
 *
 * Note: The `CloudFront-Viewer-Country` header must be enabled in the CloudFront
 * cache policy (under "Headers") for the origin behavior.
 *
 * @param targetHeader - The request header to copy the country code into.
 *   Default: `'x-viewer-country'`.
 * @returns A `BehaviorFn` to use as the second argument to `rule()`.
 *
 * @example
 * ```ts
 * import { sendCountryCode } from '@rayselfs/cf-rule-engine/helpers'
 * import { rule } from '@rayselfs/cf-rule-engine'
 * import { defineViewerRequest } from '@rayselfs/cf-rule-engine/adapters/cf-function'
 *
 * export default defineViewerRequest([
 *   // Forward country code using the default header name
 *   rule(sendCountryCode()),
 *
 *   // Forward using a custom header name
 *   rule(sendCountryCode('x-viewer-country')),
 * ])
 * ```
 */
export function sendCountryCode(targetHeader?: string): BehaviorFn {
  const target = targetHeader ?? 'x-viewer-country'
  return copyHeader('cloudfront-viewer-country', target)
}
