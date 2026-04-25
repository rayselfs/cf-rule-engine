"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

var _chunkSP7PJSDJcjs = require('./chunk-SP7PJSDJ.cjs');

// src/criteria/user-agent-matches.ts
function userAgentMatches(...patterns) {
  return (req) => {
    const ua = _optionalChain([req, 'access', _ => _.headers, 'access', _2 => _2["user-agent"], 'optionalAccess', _3 => _3.value]);
    if (!ua) return false;
    return _chunkSP7PJSDJcjs.matchesAnyWildcard.call(void 0, ua, patterns);
  };
}



exports.userAgentMatches = userAgentMatches;
