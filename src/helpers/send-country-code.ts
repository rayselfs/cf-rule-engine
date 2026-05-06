import type { BehaviorFn } from '../core/types.js'
import { copyHeader } from '../behaviors/copy-header.js'

export function sendCountryCode(targetHeader?: string): BehaviorFn {
  const target = targetHeader ?? 'x-htc-request-country-code'
  return copyHeader('cloudfront-viewer-country', target)
}
