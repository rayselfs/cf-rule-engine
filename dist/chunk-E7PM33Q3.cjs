"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

var _chunkWHWH2UXKcjs = require('./chunk-WHWH2UXK.cjs');


var _chunk75ZPJI57cjs = require('./chunk-75ZPJI57.cjs');

// src/adapters/cf-function.ts
var cf_function_exports = {};
_chunk75ZPJI57cjs.__export.call(void 0, cf_function_exports, {
  defineViewerRequest: () => defineViewerRequest,
  defineViewerResponse: () => defineViewerResponse
});
function normalizeRequest(event) {
  const ev = event;
  const req = ev.request;
  const viewer = ev.viewer;
  const headers = _nullishCoalesce(req.headers, () => ( {}));
  return {
    uri: req.uri,
    method: req.method,
    protocol: "https",
    querystring: _nullishCoalesce(req.querystring, () => ( {})),
    headers,
    clientIp: _nullishCoalesce(_optionalChain([viewer, 'optionalAccess', _ => _.ip]), () => ( "")),
    country: _optionalChain([headers, 'access', _2 => _2["cloudfront-viewer-country"], 'optionalAccess', _3 => _3.value])
  };
}
function denormalizeRequest(req) {
  return {
    method: req.method,
    uri: req.uri,
    querystring: req.querystring,
    headers: req.headers,
    cookies: {}
  };
}
function denormalizeResponse(res) {
  return {
    statusCode: res.statusCode,
    statusDescription: res.statusDescription,
    headers: res.headers,
    body: _nullishCoalesce(res.body, () => ( ""))
  };
}
function defineViewerRequest(rules) {
  return (event) => {
    const req = normalizeRequest(event);
    const result = _chunkWHWH2UXKcjs.runRules.call(void 0, rules, req);
    if (result.action === "respond") return denormalizeResponse(result.response);
    return denormalizeRequest(result.request);
  };
}
function defineViewerResponse(responseBehaviors) {
  return (event) => {
    const ev = event;
    const evRes = ev.response;
    const req = normalizeRequest(event);
    let response = {
      statusCode: _nullishCoalesce(_optionalChain([evRes, 'optionalAccess', _4 => _4.statusCode]), () => ( 200)),
      statusDescription: _optionalChain([evRes, 'optionalAccess', _5 => _5.statusDescription]),
      headers: _nullishCoalesce(_optionalChain([evRes, 'optionalAccess', _6 => _6.headers]), () => ( {})),
      body: _optionalChain([evRes, 'optionalAccess', _7 => _7.body])
    };
    for (const behavior of responseBehaviors) {
      response = behavior(req, response);
    }
    const normalized = denormalizeResponse(response);
    return { ...evRes, ...normalized };
  };
}





exports.defineViewerRequest = defineViewerRequest; exports.defineViewerResponse = defineViewerResponse; exports.cf_function_exports = cf_function_exports;
