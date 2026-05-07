import type { CriteriaFn } from '../core/types.js'

/**
 * Returns true if the viewer's country matches any of the given ISO 3166-1 alpha-2 country codes.
 *
 * Reads the `CloudFront-Viewer-Country` request header, which CloudFront populates based on
 * the viewer's IP geolocation. Comparison is case-insensitive — `'tw'` and `'TW'` both match.
 * If the header is absent (e.g. in local testing), the criterion returns `false`.
 *
 * **Prerequisite**: The CloudFront cache behavior must be configured to forward the
 * `CloudFront-Viewer-Country` header to the function. In Terraform, add it to the
 * `headers_config` in the associated cache policy or origin request policy.
 *
 * Akamai equivalent: `userLocation` criterion with `COUNTRY` field and `IS_ONE_OF` match type.
 *
 * @param codes - Array of ISO 3166-1 alpha-2 country codes (e.g. `['TW', 'US', 'JP']`).
 * @returns A `CriteriaFn` that evaluates to `true` when the viewer country matches any listed code.
 *
 * @example
 * ```typescript
 * import { rule } from '@viverse/cf-engine'
 * import { countryIs } from '@viverse/cf-engine/criteria'
 * import { redirect } from '@viverse/cf-engine/behaviors'
 *
 * // Redirect mainland China traffic to the CN domain
 * rule(countryIs(['CN']), redirect(302, 'https://www.viverse.cn'))
 *
 * // Serve region-specific content for APAC countries
 * rule(countryIs(['TW', 'JP', 'KR', 'SG', 'HK']),
 *   redirect(302, 'https://www.viverse.com/apac'))
 * ```
 */
export function countryIs(codes: string[]): CriteriaFn {
  return (req) => {
    const country = req.headers['cloudfront-viewer-country']?.value?.toUpperCase()
    if (!country) return false
    return codes.some(c => c.toUpperCase() === country)
  }
}
