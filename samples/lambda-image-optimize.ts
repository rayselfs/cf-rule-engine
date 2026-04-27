import { rule, all } from '@viverse/cf-engine'
import { fileExtension, pathPrefix } from '@viverse/cf-engine/criteria'
import { imageOptimize } from '@viverse/cf-engine/behaviors'
import { defineViewerRequest } from '@viverse/cf-engine/adapters/lambda-edge'

// Image Manager — Lambda@Edge viewer-request
//
// Replicates Akamai's `imageManager` + `imOverride` behaviors:
//   - Rewrites image requests to an imgproxy service URL
//   - Selects format via Accept header (avif > webp > jpeg)
//   - Selects width via CloudFront-Viewer-Width header or `imwidth` query param
//   - Supports `imformat` query param for Akamai-compatible format overrides
//     (chrome/webp → webp, avif → avif, ie/safari/generic → jpeg)
//
// Prerequisite: CloudFront distribution must forward these headers to Lambda:
//   - Accept
//   - CloudFront-Viewer-Width  (enable in cache policy)

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif']

export const handler = defineViewerRequest([
  rule(
    all(
      pathPrefix('/images/'),
      fileExtension(...IMAGE_EXTENSIONS),
    ),
    imageOptimize({
      serviceEndpoint: 'https://imgproxy.example.internal',
      sourceBaseUrl: 'https://assets.example.com',
      breakpoints: [320, 640, 960, 1280, 1920],
      formats: ['avif', 'webp', 'jpeg'],
      quality: 85,
    }),
  ),
])
