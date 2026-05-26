import { rule, all } from '@rayselfs/cf-rule-engine'
import { fileExtension, pathPrefix } from '@rayselfs/cf-rule-engine/criteria'
import { imageOptimize } from '@rayselfs/cf-rule-engine/behaviors'
import { defineViewerRequest } from '@rayselfs/cf-rule-engine/adapters/cf-function'

// Image Manager — CF Function viewer-request (querystring normalizer)
//
// Replicates Akamai's `imageManager` + `imOverride` behaviors:
//   - Snaps imwidth to the nearest ceiling breakpoint
//   - Translates imformat (Akamai IM) to f param
//   - Sets default q=75 if not specified
//
// Requires: imgproxy-processing Lambda@Edge at origin-request on the same behavior.
// That Lambda handles HMAC signing and imgproxy URL construction.
//
// CloudFront cache policy must forward:
//   - Accept
//   - CloudFront-Viewer-Width

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif']

export const handler = defineViewerRequest([
  rule(
    all(
      pathPrefix('/images/'),
      fileExtension(...IMAGE_EXTENSIONS),
    ),
    imageOptimize({
      breakpoints: [320, 640, 960, 1280, 1920],
      formats: ['avif', 'webp', 'jpeg'],
      quality: 75,
    }),
  ),
])
