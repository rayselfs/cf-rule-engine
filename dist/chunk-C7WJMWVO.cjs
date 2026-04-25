"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }

var _chunkWHWH2UXKcjs = require('./chunk-WHWH2UXK.cjs');


var _chunk75ZPJI57cjs = require('./chunk-75ZPJI57.cjs');

// src/adapters/lambda-edge.ts
var lambda_edge_exports = {};
_chunk75ZPJI57cjs.__export.call(void 0, lambda_edge_exports, {
  defineViewerRequest: () => defineViewerRequest,
  defineViewerResponse: () => defineViewerResponse
});
function normalizeHeaders(headers) {
  const result = {};
  for (const [key, arr] of Object.entries(_nullishCoalesce(headers, () => ( {})))) {
    if (arr.length > 0) result[key.toLowerCase()] = { value: arr[0].value };
  }
  return result;
}
function denormalizeHeaders(headers) {
  const result = {};
  for (const [key, { value }] of Object.entries(headers)) {
    result[key] = [{ key, value }];
  }
  return result;
}
function parseQuerystring(qs) {
  if (!qs) return {};
  return Object.fromEntries(
    qs.split("&").map((p) => {
      const [k, v = ""] = p.split("=");
      return [k, { value: v }];
    })
  );
}
function serializeQuerystring(qs) {
  return Object.entries(qs).map(([k, { value }]) => `${k}=${value}`).join("&");
}
function defineViewerRequest(rules) {
  return async (event) => {
    const ev = event;
    const records = ev.Records;
    const cf = records[0].cf;
    const lambdaReq = cf.request;
    const req = {
      uri: lambdaReq.uri,
      method: lambdaReq.method,
      protocol: "https",
      querystring: parseQuerystring(_nullishCoalesce(lambdaReq.querystring, () => ( ""))),
      headers: normalizeHeaders(
        _nullishCoalesce(lambdaReq.headers, () => ( {}))
      ),
      clientIp: _nullishCoalesce(lambdaReq.clientIp, () => ( ""))
    };
    const result = _chunkWHWH2UXKcjs.runRules.call(void 0, rules, req);
    if (result.action === "respond") {
      return {
        status: String(result.response.statusCode),
        statusDescription: result.response.statusDescription,
        headers: denormalizeHeaders(result.response.headers),
        body: _nullishCoalesce(result.response.body, () => ( ""))
      };
    }
    return {
      ...lambdaReq,
      uri: result.request.uri,
      querystring: serializeQuerystring(result.request.querystring),
      headers: denormalizeHeaders(result.request.headers)
    };
  };
}
function defineViewerResponse(responseBehaviors) {
  return async (event) => {
    const ev = event;
    const records = ev.Records;
    const cf = records[0].cf;
    const lambdaReq = cf.request;
    const lambdaRes = cf.response;
    const req = {
      uri: lambdaReq.uri,
      method: lambdaReq.method,
      protocol: "https",
      querystring: parseQuerystring(_nullishCoalesce(lambdaReq.querystring, () => ( ""))),
      headers: normalizeHeaders(
        _nullishCoalesce(lambdaReq.headers, () => ( {}))
      ),
      clientIp: _nullishCoalesce(lambdaReq.clientIp, () => ( ""))
    };
    let response = {
      statusCode: parseInt(lambdaRes.status, 10),
      statusDescription: lambdaRes.statusDescription,
      headers: normalizeHeaders(
        _nullishCoalesce(lambdaRes.headers, () => ( {}))
      ),
      body: lambdaRes.body
    };
    for (const behavior of responseBehaviors) {
      response = behavior(req, response);
    }
    return {
      ...lambdaRes,
      status: String(response.statusCode),
      statusDescription: response.statusDescription,
      headers: denormalizeHeaders(response.headers)
    };
  };
}





exports.defineViewerRequest = defineViewerRequest; exports.defineViewerResponse = defineViewerResponse; exports.lambda_edge_exports = lambda_edge_exports;
