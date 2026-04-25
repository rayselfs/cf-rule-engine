import {
  runRules
} from "./chunk-66KS5PTC.js";
import {
  __export
} from "./chunk-MLKGABMK.js";

// src/adapters/lambda-edge.ts
var lambda_edge_exports = {};
__export(lambda_edge_exports, {
  defineViewerRequest: () => defineViewerRequest,
  defineViewerResponse: () => defineViewerResponse
});
function normalizeHeaders(headers) {
  const result = {};
  for (const [key, arr] of Object.entries(headers ?? {})) {
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
      querystring: parseQuerystring(lambdaReq.querystring ?? ""),
      headers: normalizeHeaders(
        lambdaReq.headers ?? {}
      ),
      clientIp: lambdaReq.clientIp ?? ""
    };
    const result = runRules(rules, req);
    if (result.action === "respond") {
      return {
        status: String(result.response.statusCode),
        statusDescription: result.response.statusDescription,
        headers: denormalizeHeaders(result.response.headers),
        body: result.response.body ?? ""
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
      querystring: parseQuerystring(lambdaReq.querystring ?? ""),
      headers: normalizeHeaders(
        lambdaReq.headers ?? {}
      ),
      clientIp: lambdaReq.clientIp ?? ""
    };
    let response = {
      statusCode: parseInt(lambdaRes.status, 10),
      statusDescription: lambdaRes.statusDescription,
      headers: normalizeHeaders(
        lambdaRes.headers ?? {}
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

export {
  defineViewerRequest,
  defineViewerResponse,
  lambda_edge_exports
};
