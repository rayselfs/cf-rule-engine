import type { CriteriaFn } from '../core/types.js'

/** Returns true if the CloudFront-detected country matches any of the given country codes (case-insensitive). */
export function countryIs(...codes: string[]): CriteriaFn {
  return (req) => {
    const country = req.headers['cloudfront-viewer-country']?.value?.toUpperCase()
    if (!country) return false
    return codes.some(c => c.toUpperCase() === country)
  }
}
