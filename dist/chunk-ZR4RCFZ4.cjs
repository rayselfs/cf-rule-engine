"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }// src/criteria/header-equals.ts
function headerEquals(headerName, ...values) {
  return (req) => {
    const val = _optionalChain([req, 'access', _ => _.headers, 'access', _2 => _2[headerName.toLowerCase()], 'optionalAccess', _3 => _3.value]);
    if (val === void 0) return false;
    return values.some((v) => v.toLowerCase() === val.toLowerCase());
  };
}



exports.headerEquals = headerEquals;
