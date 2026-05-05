/**
 * stream-stage viewer-response handler
 *
 * Example CloudFront Function for the stream-stage.viverse.com domain.
 * Demonstrates CORS header configuration using @viverse/cf-engine.
 *
 * Build: esbuild viewer-response.ts --bundle --minify --target=es5 --platform=browser --format=iife --outfile=dist/viewer-response.js
 */

import { all, hostnameIs } from '@viverse/cf-engine'
import { pathMatches } from '@viverse/cf-engine/criteria/path-matches'
import { setCorsHeaders } from '@viverse/cf-engine/behaviors/set-cors-headers'
import { defineViewerResponse } from '@viverse/cf-engine/adapters/cf-function'

// --- Configuration Values ---

const ASSET_PATHS = [
  '/assets/downloads/*',
  '/assets/streamablemodel/*',
  '/demos/dinosaurs-107m/*',
  '/demos/jet/*',
  '/marketing/transparent-bg/*',
  '/polygon_file/*',
]

// --- Behaviors ---

export default defineViewerResponse([
  // Behavior 1: Domain-scoped CORS
  // For requests to stream-stage.viverse.com with origins from *.viverse.com,
  // echo back the origin (ACAO = Access-Control-Allow-Origin).
  {
    criteria: all([
      hostnameIs(['stream-stage.viverse.com']),
      (req) => (req.headers['origin']?.value ?? '').includes('.viverse.com'),
    ]),
    behavior: setCorsHeaders({
      allowOriginEcho: true,
      allowedOrigins: ['https://*.viverse.com'],
      allowedMethods: 'GET, POST, OPTIONS',
      allowedHeaders: 'Content-Type, Cache-Control, Pragma, Range',
    }),
  },

  // Behavior 2: Public asset CORS
  // For publicly accessible asset paths, allow CORS from any origin.
  {
    criteria: all([
      pathMatches(ASSET_PATHS),
      (req) => !!req.headers['origin']?.value,
    ]),
    behavior: setCorsHeaders({
      allowedOrigins: ['*'],
      allowedMethods: 'GET, POST, OPTIONS',
      allowedHeaders: 'Content-Type, Cache-Control, Pragma, Range',
    }),
  },
])
