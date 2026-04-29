import type { CriteriaFn } from '../core/types.js'

/** Returns true if the request path has any of the given file extensions (case-insensitive). */
export function fileExtension(extensions: string[]): CriteriaFn {
  return (req) => {
    const path = req.uri.split('?')[0]
    const dot = path.lastIndexOf('.')
    if (dot === -1) return false
    const ext = path.slice(dot + 1).toLowerCase()
    return extensions.some(e => e.toLowerCase() === ext)
  }
}
