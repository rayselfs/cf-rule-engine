"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }// src/behaviors/set-security-headers.ts
function setSecurityHeaders(options) {
  const hsts = _nullishCoalesce(_optionalChain([options, 'optionalAccess', _ => _.hsts]), () => ( "max-age=31536000; includeSubDomains"));
  const xFrameOptions = _nullishCoalesce(_optionalChain([options, 'optionalAccess', _2 => _2.xFrameOptions]), () => ( "SAMEORIGIN"));
  const xContentTypeOptions = _nullishCoalesce(_optionalChain([options, 'optionalAccess', _3 => _3.xContentTypeOptions]), () => ( "nosniff"));
  return (_request, response) => {
    return {
      ...response,
      headers: {
        ...response.headers,
        "strict-transport-security": { value: hsts },
        "x-frame-options": { value: xFrameOptions },
        "x-content-type-options": { value: xContentTypeOptions }
      }
    };
  };
}



exports.setSecurityHeaders = setSecurityHeaders;
