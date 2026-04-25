"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }// src/behaviors/set-cors-headers.ts
function matchesOriginPattern(origin, pattern) {
  if (pattern === "*") return true;
  if (!pattern.includes("*")) return origin === pattern;
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`).test(origin);
}
function setCorsHeaders(options) {
  const allowedOrigins = _nullishCoalesce(_optionalChain([options, 'optionalAccess', _ => _.allowedOrigins]), () => ( ["*"]));
  const allowedMethods = _nullishCoalesce(_optionalChain([options, 'optionalAccess', _2 => _2.allowedMethods]), () => ( "GET, POST, OPTIONS"));
  const allowedHeaders = _nullishCoalesce(_optionalChain([options, 'optionalAccess', _3 => _3.allowedHeaders]), () => ( "Content-Type, Cache-Control, Pragma, Range"));
  return (request, response) => {
    let allowOrigin = _nullishCoalesce(allowedOrigins[0], () => ( "*"));
    if (_optionalChain([options, 'optionalAccess', _4 => _4.allowOriginEcho])) {
      const originHeader = _optionalChain([request, 'access', _5 => _5.headers, 'access', _6 => _6["origin"], 'optionalAccess', _7 => _7.value]);
      if (originHeader && allowedOrigins.some((p) => matchesOriginPattern(originHeader, p))) {
        allowOrigin = originHeader;
      }
    }
    const corsHeaders = {
      "access-control-allow-origin": { value: allowOrigin },
      "access-control-allow-methods": { value: allowedMethods },
      "access-control-allow-headers": { value: allowedHeaders }
    };
    if (_optionalChain([options, 'optionalAccess', _8 => _8.allowCredentials])) {
      corsHeaders["access-control-allow-credentials"] = { value: "true" };
    }
    if (_optionalChain([options, 'optionalAccess', _9 => _9.maxAge]) !== void 0) {
      corsHeaders["access-control-max-age"] = { value: String(options.maxAge) };
    }
    return {
      ...response,
      headers: { ...response.headers, ...corsHeaders }
    };
  };
}



exports.setCorsHeaders = setCorsHeaders;
