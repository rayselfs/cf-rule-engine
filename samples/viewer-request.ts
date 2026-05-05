/**
 * stream-stage viewer-request handler
 *
 * Example CloudFront Function for the stream-stage.viverse.com domain.
 * Demonstrates how to use @viverse/cf-engine for request-stage routing and filtering.
 *
 * Build: esbuild viewer-request.ts --bundle --minify --target=es5 --platform=browser --format=iife --outfile=dist/viewer-request.js
 */

import { rule, all, not } from '@viverse/cf-engine'
import { ipCidr } from '@viverse/cf-engine/criteria/ip-cidr'
import { pathMatches } from '@viverse/cf-engine/criteria/path-matches'
import { userAgentMatches } from '@viverse/cf-engine/criteria/user-agent-matches'
import { methodIs } from '@viverse/cf-engine/criteria/method-is'
import { redirect } from '@viverse/cf-engine/behaviors/redirect'
import { rewriteUri } from '@viverse/cf-engine/behaviors/rewrite-uri'
import { constructResponse } from '@viverse/cf-engine/behaviors/construct-response'
import { copyHeader } from '@viverse/cf-engine/behaviors/copy-header'
import { defineViewerRequest } from '@viverse/cf-engine/adapters/cf-function'

// --- Configuration Values ---
// These would normally come from a values.ts file shared with infra code.

const WHITELIST_CIDRS = [
  '61.218.44.76/32',
  '122.147.213.24/32',
  '60.251.61.121/32',
  '162.120.184.42/32',
  '175.98.157.254/32',
  '122.147.173.254/32',
  '52.33.9.56/32',
  '52.35.160.39/32',
  '50.112.203.191/32',
]

const WHITELIST_UA_SUBSTRINGS = ['HTCVRSDET', 'Prerender', 'HTC3PARTY']

const BYPASS_PATHS = ['/akamai/*', '/favicon.ico', '/rest/*', '/api/*', '/graphql*', '/management/*', '/polygon_file/*']

// --- Rules ---

export default defineViewerRequest([
  // Rule 1: Stage whitelist enforcement
  // Block requests from non-whitelisted IPs without whitelisted user agents,
  // unless they're accessing bypass paths (static assets, APIs, etc.)
  rule(
    all([
      not(ipCidr(WHITELIST_CIDRS)),
      not(userAgentMatches(WHITELIST_UA_SUBSTRINGS)),
      not(pathMatches(BYPASS_PATHS)),
    ]),
    redirect(302, 'https://stream.viverse.com/console'),
  ),

  // Rule 2: Block /metrics endpoint
  // Deny access to internal metrics endpoint
  rule(pathMatches(['/metrics']), redirect(302, '/')),

  // Rule 3: Root path rewrite
  // Rewrite requests to / to /console/landing
  rule(pathMatches(['/'])), rewriteUri('set', '/console/landing')),

  // Rule 4: CORS preflight
  // Return 200 OK for OPTIONS requests
  rule(methodIs(['OPTIONS']), constructResponse({ statusCode: 200, body: 'ok' })),

  // Rule 5: Copy CloudFront country header
  // Pass through CloudFront's country detection to downstream services
  rule(copyHeader('CloudFront-Viewer-Country', 'X-HTC-Request-Country-Code')),
])
