"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }// src/behaviors/redirect.ts
var statusDescriptions = {
  301: "Moved Permanently",
  302: "Found",
  307: "Temporary Redirect"
};
function redirect(statusCode, location, options) {
  return (request) => {
    let finalLocation = location;
    if (_optionalChain([options, 'optionalAccess', _ => _.preserveQuerystring])) {
      const qs = Object.entries(request.querystring).map(([k, v]) => `${k}=${v.value}`).join("&");
      if (qs) {
        finalLocation = `${location}?${qs}`;
      }
    }
    return {
      action: "respond",
      response: {
        statusCode,
        statusDescription: statusDescriptions[statusCode],
        headers: {
          location: { value: finalLocation },
          "cache-control": { value: "no-store" }
        }
      }
    };
  };
}



exports.redirect = redirect;
