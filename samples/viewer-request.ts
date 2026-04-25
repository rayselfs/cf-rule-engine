/**
 * viewer-request handler example
 *
 * Example CloudFront Function viewer-request configuration.
 * Demonstrates how to use @rayselfs/cf-rule-engine for request-stage routing and filtering.
 *
 * Build: esbuild viewer-request.ts --bundle --minify --target=es5 --platform=browser --format=iife --outfile=dist/viewer-request.js
 */

import { rule, all, not } from '@rayselfs/cf-rule-engine'
import { ipCidr } from '@rayselfs/cf-rule-engine/criteria/ip-cidr'
import { pathMatches } from '@rayselfs/cf-rule-engine/criteria/path-matches'
import { userAgentMatches } from '@rayselfs/cf-rule-engine/criteria/user-agent-matches'
import { methodIs } from '@rayselfs/cf-rule-engine/criteria/method-is'
import { redirect } from '@rayselfs/cf-rule-engine/behaviors/redirect'
import { rewriteUri } from '@rayselfs/cf-rule-engine/behaviors/rewrite-uri'
import { constructResponse } from '@rayselfs/cf-rule-engine/behaviors/construct-response'
import { copyHeader } from '@rayselfs/cf-rule-engine/behaviors/copy-header'
import { defineViewerRequest } from '@rayselfs/cf-rule-engine/adapters/cf-function'

// --- Configuration Values ---
// These would normally come from a values.ts file shared with infra code.

const WHITELIST_CIDRS = [
  '192.0.2.0/24',
  '198.51.100.0/24',
  '203.0.113.0/24',
]

const WHITELIST_UA_SUBSTRINGS = ['MYBOT', 'Prerender', 'PARTNER']

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
    redirect(302, 'https://stream.example.com/console'),
  ),

  // Rule 2: Block /metrics endpoint
  // Deny access to internal metrics endpoint
  rule(pathMatches(['/metrics']), redirect(302, '/')),

  // Rule 3: Root path rewrite
  // Rewrite requests to / to /console/landing
  rule(pathMatches(['/']), rewriteUri('set', '/console/landing')),

  // Rule 4: CORS preflight
  // Return 200 OK for OPTIONS requests
  rule(methodIs(['OPTIONS']), constructResponse({ statusCode: 200, body: 'ok' })),

  // Rule 5: Copy CloudFront country header
  // Pass through CloudFront's country detection to downstream services
  rule(copyHeader('CloudFront-Viewer-Country', 'X-Viewer-Country')),
])
