import type { BehaviorFn, HttpRequest } from '../core/types.js'

/**
 * Origin configuration for image-optimize-proxy.
 *
 * Determines which request headers are injected so the proxy knows where to
 * fetch the source image:
 *   - gateway: injects X-Img-Source-Type=gateway and X-Img-Upstream-Gateway
 *   - s3:      injects X-Img-Source-Type=s3 and X-Img-Source-Bucket
 */
export type ImageOriginConfig =
  | { type: 'gateway'; upstreamGateway: string }
  | { type: 's3'; sourceBucket: string }

/**
 * Options for imageOptimize querystring normalization behavior.
 *
 * This behavior normalizes Akamai Image Manager-compatible query parameters
 * for use with the `image-optimize-proxy` K8s proxy at origin, which reads
 * the normalized `imwidth`, `f`, and `q` params to drive imgproxy transformation
 * and S3 caching.
 */
export interface ImageOptimizeOptions {
  /** Ordered list of breakpoint widths (px). Request widths snap to the nearest ceiling breakpoint. */
  breakpoints: number[]
  /** Preferred format priority. Defaults to ['avif', 'webp', 'jpeg']. */
  formats?: ('avif' | 'webp' | 'jpeg')[]
  /** Default image quality (1-100). Defaults to 75. */
  quality?: number
  /** Query string param name for width override (Akamai IM compatible). Default: 'imwidth' */
  imwidthParam?: string
  /** Query string param name for format override (Akamai IM compatible). Default: 'imformat' */
  imformatParam?: string
  /**
   * Origin configuration for image-optimize-proxy.
   * When provided, injects the corresponding X-Img-* request headers so the
   * proxy knows how to resolve the source image. This removes the need to
   * configure CloudFront origin custom headers separately in Terraform.
   */
  origin?: ImageOriginConfig
  /**
   * CloudFront origin verification secret.
   * When provided, injects the value as the X-Origin-Verify request header.
   * The proxy validates this header to ensure requests originate from CloudFront.
   */
  originSecret?: string
}

/** Resolved normalized image parameters. */
export interface ResolvedImageParams {
  /** Width snapped to nearest ceiling breakpoint. */
  breakpoint: number
  /** Resolved output format. */
  format: 'avif' | 'webp' | 'jpeg'
  /** Quality value (1-100). */
  quality: number
}

function selectBreakpoint(width: number, breakpoints: number[]): number {
  const sorted = breakpoints.slice().sort(function (a, b) { return a - b })
  for (var i = 0; i < sorted.length; i++) {
    if (sorted[i] >= width) return sorted[i]
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
): 'avif' | 'webp' | 'jpeg' {
  if (acceptHeader) {
    for (var i = 0; i < formats.length; i++) {
      if (formats[i] === 'avif' && acceptHeader.indexOf('image/avif') !== -1) return 'avif'
      if (formats[i] === 'webp' && acceptHeader.indexOf('image/webp') !== -1) return 'webp'
    }
  }
  return formats[formats.length - 1] !== undefined ? formats[formats.length - 1] : 'jpeg'
}

/**
 * Resolves normalized image parameters (breakpoint, format, quality) from a request.
 *
 * Shared logic consumed by both the `imageOptimize` CF Function behavior and the
 * `imageOptimizeJS` Lambda handler — keeps param resolution consistent across paths.
 *
 * Width resolution order: `imwidth` query param → `CloudFront-Viewer-Width` header → largest breakpoint.
 * Format resolution order: `imformat` query param (Akamai IM) → `Accept` header → last format in list.
 */
export function resolveImageParams(
  request: Pick<HttpRequest, 'querystring' | 'headers'>,
  options: {
    breakpoints: number[]
    formats?: ('avif' | 'webp' | 'jpeg')[]
    quality?: number
    imwidthParam?: string
    imformatParam?: string
  },
): ResolvedImageParams {
  var formats = options.formats !== undefined ? options.formats : ['avif', 'webp', 'jpeg'] as ('avif' | 'webp' | 'jpeg')[]
  var quality = options.quality !== undefined ? options.quality : 75
  var sortedBreakpoints = options.breakpoints.slice().sort(function (a, b) { return a - b })
  var imwidthParamName = options.imwidthParam !== undefined ? options.imwidthParam : 'imwidth'
  var imformatParamName = options.imformatParam !== undefined ? options.imformatParam : 'imformat'

  // Width: imwidth param > CloudFront-Viewer-Width header > largest breakpoint
  var width = NaN
  var imwidthVal = request.querystring[imwidthParamName] !== undefined ? request.querystring[imwidthParamName].value : undefined
  if (imwidthVal !== undefined) {
    var parsed = parseInt(imwidthVal, 10)
    if (isFinite(parsed)) width = parsed
  }
  if (!isFinite(width)) {
    var widthHeader = request.headers['cloudfront-viewer-width'] !== undefined ? request.headers['cloudfront-viewer-width'].value : undefined
    if (widthHeader !== undefined) {
      var parsedHeader = parseInt(widthHeader, 10)
      if (isFinite(parsedHeader)) width = parsedHeader
    }
  }
  var breakpoint = isFinite(width)
    ? selectBreakpoint(width, sortedBreakpoints)
    : sortedBreakpoints[sortedBreakpoints.length - 1]

  // Format: imformat param (Akamai IM) > Accept header > last in formats list
  var format: 'avif' | 'webp' | 'jpeg'
  var imformatVal = request.querystring[imformatParamName] !== undefined ? request.querystring[imformatParamName].value : undefined
  if (imformatVal !== undefined) {
    format = mapAkamaiFormat(imformatVal)
  } else {
    var acceptVal = request.headers['accept'] !== undefined ? request.headers['accept'].value : undefined
    format = selectFormat(acceptVal, formats)
  }

  return { breakpoint: breakpoint, format: format, quality: quality }
}

/**
 * Normalizes image-related query string parameters for use with the
 * `image-optimize-proxy` K8s origin proxy, and optionally injects the
 * origin routing headers so the proxy knows where to fetch source images.
 *
 * What this CF Function behavior does:
 *   - Snaps `imwidth` (or `CloudFront-Viewer-Width`) to the nearest ceiling breakpoint
 *   - Translates `imformat` (Akamai IM) to `f` param that `image-optimize-proxy` reads
 *   - Converts legacy `quality` param to `q` and removes `quality` from querystring
 *   - Adds default `q` (quality) param if not already set
 *   - Removes the `imformat` param after translation
 *   - Leaves `uri` unchanged — imgproxy URL construction is the proxy's responsibility
 *   - When `origin` is set, injects X-Img-Source-Type and X-Img-Upstream-Gateway
 *     or X-Img-Source-Bucket headers (eliminates need for Terraform origin custom headers)
 *   - When `originSecret` is set, injects X-Origin-Verify header
 *
 * Architecture:
 *   CF Function (viewer-request): imageOptimize — normalize querystring + inject origin headers
 *   image-optimize-proxy (origin): reads imwidth/f/q + X-Img-* headers, calls imgproxy sidecar, caches to S3
 *
 * Akamai `imformat` mapping:
 *   chrome / webp → webp
 *   avif          → avif
 *   ie / safari / generic / (other) → jpeg
 */
export function imageOptimize(options: ImageOptimizeOptions): BehaviorFn {
  var imformatParamName = options.imformatParam !== undefined ? options.imformatParam : 'imformat'

  return function (request: HttpRequest) {
    var resolved = resolveImageParams(request, options)

    var qs = Object.assign({}, request.querystring)

    qs['imwidth'] = { value: String(resolved.breakpoint) }
    qs['f'] = { value: resolved.format }

    // Convert legacy `quality` param to `q`. Proxy only reads `q`; leaving
    // `quality` in the querystring would cause it to be silently ignored.
    if (qs['q'] === undefined) {
      var legacyQuality = qs['quality'] !== undefined ? qs['quality'].value : undefined
      qs['q'] = { value: legacyQuality !== undefined ? legacyQuality : String(resolved.quality) }
    }
    delete qs['quality']

    delete qs[imformatParamName]
    if (imformatParamName !== 'imformat') {
      delete qs['imformat']
    }

    var headers = Object.assign({}, request.headers)

    if (options.origin !== undefined) {
      headers['x-img-source-type'] = { value: options.origin.type }
      if (options.origin.type === 'gateway') {
        headers['x-img-upstream-gateway'] = { value: options.origin.upstreamGateway }
      } else {
        headers['x-img-source-bucket'] = { value: options.origin.sourceBucket }
      }
    }

    if (options.originSecret !== undefined) {
      headers['x-origin-verify'] = { value: options.originSecret }
    }

    return { action: 'continue', request: Object.assign({}, request, { querystring: qs, headers: headers }) }
  }
}
