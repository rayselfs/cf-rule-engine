"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }// src/criteria/country-is.ts
function countryIs(...codes) {
  return (req) => {
    const country = _optionalChain([req, 'access', _ => _.headers, 'access', _2 => _2["cloudfront-viewer-country"], 'optionalAccess', _3 => _3.value, 'optionalAccess', _4 => _4.toUpperCase, 'call', _5 => _5()]);
    if (!country) return false;
    return codes.some((c) => c.toUpperCase() === country);
  };
}



exports.countryIs = countryIs;
