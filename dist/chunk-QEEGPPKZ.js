import {
  runRules
} from "./chunk-66KS5PTC.js";
import {
  __export
} from "./chunk-MLKGABMK.js";

// src/adapters/cf-function.ts
var cf_function_exports = {};
__export(cf_function_exports, {
  defineViewerRequest: () => defineViewerRequest,
  defineViewerResponse: () => defineViewerResponse
});
function normalizeRequest(event) {
  const ev = event;
  const req = ev.request;
  const viewer = ev.viewer;
  const headers = req.headers ?? {};
  return {
    uri: req.uri,
    method: req.method,
    protocol: "https",
    querystring: req.querystring ?? {},
    headers,
    clientIp: viewer?.ip ?? "",
    country: headers["cloudfront-viewer-country"]?.value
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
    body: res.body ?? ""
  };
}
function defineViewerRequest(rules) {
  return (event) => {
    const req = normalizeRequest(event);
    const result = runRules(rules, req);
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
      statusCode: evRes?.statusCode ?? 200,
      statusDescription: evRes?.statusDescription,
      headers: evRes?.headers ?? {},
      body: evRes?.body
    };
    for (const behavior of responseBehaviors) {
      response = behavior(req, response);
    }
    const normalized = denormalizeResponse(response);
    return { ...evRes, ...normalized };
  };
}

export {
  defineViewerRequest,
  defineViewerResponse,
  cf_function_exports
};
