import type { BehaviorFn, HttpRequest } from '../core/types.js'

/** Options for imgproxy URL construction: breakpoints, formats, quality, service endpoint, and Akamai IM query param configuration. */
export interface ImageOptimizeOptions {
  breakpoints: number[]
  formats?: ('avif' | 'webp' | 'jpeg')[]
  quality?: number
  serviceEndpoint: string
  sourceBaseUrl: string
  /** Query string param name for width override (Akamai IM compatible). Default: 'imwidth' */
  imwidthParam?: string
  /** Query string param name for format override (Akamai IM compatible). Default: 'imformat' */
  imformatParam?: string
}

function selectBreakpoint(width: number, breakpoints: number[]): number {
  const sorted = [...breakpoints].sort((a, b) => a - b)
  for (const bp of sorted) {
    if (bp >= width) return bp
  }
  return sorted[sorted.length - 1]
}

function mapAkamaiFormat(akamaiFormat: string): 'avif' | 'webp' | 'jpeg' {
  switch (akamaiFormat) {
    case 'chrome':
    case 'webp':
      return 'webp'
    case 'avif':
      return 'avif'
    default:
      return 'jpeg'
  }
}

function selectFormat(
  acceptHeader: string | undefined,
  formats: ('avif' | 'webp' | 'jpeg')[],
): string {
  if (acceptHeader) {
    for (const fmt of formats) {
      if (fmt === 'avif' && acceptHeader.includes('image/avif')) return 'avif'
      if (fmt === 'webp' && acceptHeader.includes('image/webp')) return 'webp'
    }
  }
  return formats[formats.length - 1] ?? 'jpeg'
}

/**
 * Rewrites the request URI to an imgproxy-compatible URL.
 * Selects format via Accept header (avif > webp > jpeg) and width via CloudFront-Viewer-Width.
 * Supports Akamai-compatible `imwidth` / `imformat` query string overrides.
 */
export function imageOptimize(options: ImageOptimizeOptions): BehaviorFn {
  const formats = options.formats ?? ['avif', 'webp', 'jpeg']
  const quality = options.quality ?? 85
  const sortedBreakpoints = [...options.breakpoints].sort((a, b) => a - b)
  const imwidthParamName = options.imwidthParam ?? 'imwidth'
  const imformatParamName = options.imformatParam ?? 'imformat'

  return (request: HttpRequest) => {
    // Determine width: query param > header > largest breakpoint
    let width = NaN
    const imwidthParam = request.querystring[imwidthParamName]?.value
    if (imwidthParam) {
      const parsed = parseInt(imwidthParam, 10)
      if (Number.isFinite(parsed)) {
        width = parsed
      }
    }
    if (!Number.isFinite(width)) {
      const widthStr = request.headers['cloudfront-viewer-width']?.value
      width = widthStr ? parseInt(widthStr, 10) : NaN
    }
    const breakpoint = Number.isFinite(width)
      ? selectBreakpoint(width, sortedBreakpoints)
      : sortedBreakpoints[sortedBreakpoints.length - 1]

    // Determine format: query param > accept header
    let format: string
    const imformatParam = request.querystring[imformatParamName]?.value
    if (imformatParam) {
      format = mapAkamaiFormat(imformatParam)
    } else {
      const acceptHeader = request.headers['accept']?.value
      format = selectFormat(acceptHeader, formats)
    }

    const uri = `${options.serviceEndpoint}/rs:fit:${breakpoint}/f:${format}/q:${quality}/plain/${options.sourceBaseUrl}${request.uri}`

    return { action: 'continue', request: { ...request, uri } }
  }
}
