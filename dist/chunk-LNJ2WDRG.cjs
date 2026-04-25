"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }// src/behaviors/copy-header.ts
function copyHeader(sourceHeader, targetHeader) {
  return (request) => {
    const sourceValue = _optionalChain([request, 'access', _ => _.headers, 'access', _2 => _2[sourceHeader.toLowerCase()], 'optionalAccess', _3 => _3.value]);
    if (sourceValue === void 0) {
      return { action: "continue", request };
    }
    return {
      action: "continue",
      request: {
        ...request,
        headers: {
          ...request.headers,
          [targetHeader.toLowerCase()]: { value: sourceValue }
        }
      }
    };
  };
}



exports.copyHeader = copyHeader;
