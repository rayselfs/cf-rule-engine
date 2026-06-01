import type { CriteriaFn } from '../core/types.js'

/**
 * Returns true if the request URI's file extension matches any of the given extensions.
 *
 * The extension is extracted from the path portion of the URI (query string is stripped
 * before matching). Comparison is case-insensitive — `'jpg'` matches `.JPG`, `.jpg`, etc.
 * If the URI has no extension (no `.` in the final path segment), the criterion returns `false`.
 *
 * Akamai equivalent: `fileExtension` criterion.
 *
 * @param extensions - Array of file extensions to match, without leading dot (e.g. `['jpg', 'png', 'gif']`).
 * @returns A `CriteriaFn` that evaluates to `true` when the URI's extension matches any entry.
 *
 * @example
 * ```typescript
 * import { rule } from '@rayselfs/cf-rule-engine'
 * import { fileExtension } from '@rayselfs/cf-rule-engine/criteria'
 * import { setCacheControl, imageOptimize } from '@rayselfs/cf-rule-engine/behaviors'
 *
 * // Apply long-lived cache to static assets
 * rule(fileExtension(['js', 'css', 'woff2', 'woff']),
 *   setCacheControl('public, max-age=31536000, immutable'))
 *
 * // Apply image optimization for image requests
 * rule(fileExtension(['jpg', 'jpeg', 'png', 'gif']),
 *   imageOptimize({ breakpoints: [320, 640, 960, 1280, 1920] }))
 * ```
 */
export function fileExtension(extensions: string[]): CriteriaFn {
  return (req) => {
    const path = req.uri.split('?')[0]
    const dot = path.lastIndexOf('.')
    if (dot === -1) return false
    const ext = path.slice(dot + 1).toLowerCase()
    return extensions.some(e => e.toLowerCase() === ext)
  }
}
