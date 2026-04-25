"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }// src/criteria/hostname-is.ts
function hostnameIs(...hostnames) {
  return (req) => {
    const host = _optionalChain([req, 'access', _ => _.headers, 'access', _2 => _2["host"], 'optionalAccess', _3 => _3.value, 'optionalAccess', _4 => _4.toLowerCase, 'call', _5 => _5()]);
    if (!host) return false;
    return hostnames.some((h) => h.toLowerCase() === host);
  };
}



exports.hostnameIs = hostnameIs;
