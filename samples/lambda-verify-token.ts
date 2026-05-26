import { rule, all } from '@rayselfs/cf-rule-engine'
import { pathPrefix } from '@rayselfs/cf-rule-engine/criteria'
import { verifyToken, stripQueryParams } from '@rayselfs/cf-rule-engine/behaviors'
import { defineViewerRequest } from '@rayselfs/cf-rule-engine/adapters/lambda-edge'

// Akamai Edge Auth Token 2.0 — Lambda@Edge viewer-request
//
// Replicates Akamai's `verifyTokenAuthorization` behavior:
//   - Validates HMAC-SHA256 signed `hdnts` query param
//   - Strips `hdnts` before forwarding to S3 origin
//   - CloudFront OAC handles S3 SigV4 auth (replaces Akamai IAM user)
//
// ⚠️  Lambda@Edge only — CF Functions lack Node.js `crypto`.
//
// Token format (Akamai Edge Auth 2.0):
//   hdnts=exp=<unix>~acl=<path>~hmac=<sha256-hex>
//
// Key source: Akamai `verifyTokenAuthorization.key` (hex-encoded secret).
// In production: load from AWS Secrets Manager during Lambda init phase.

const EDGE_AUTH_KEY = 'replace-with-your-hex-encoded-hmac-secret'

export const handler = defineViewerRequest([
  rule(
    pathPrefix('/avatars/'),
    verifyToken({ key: EDGE_AUTH_KEY }),
  ),
  rule(
    pathPrefix('/avatars/'),
    stripQueryParams(['hdnts']),
  ),
])
