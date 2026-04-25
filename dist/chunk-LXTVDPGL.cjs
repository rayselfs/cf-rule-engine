"use strict";Object.defineProperty(exports, "__esModule", {value: true});// src/behaviors/construct-response.ts
var statusDescriptions = {
  200: "OK",
  204: "No Content",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  429: "Too Many Requests",
  500: "Internal Server Error"
};
function constructResponse(options) {
  return () => {
    const headers = {
      "cache-control": { value: "no-store" }
    };
    if (options.contentType) {
      headers["content-type"] = { value: options.contentType };
    }
    if (options.headers) {
      for (const [k, v] of Object.entries(options.headers)) {
        headers[k.toLowerCase()] = { value: v };
      }
    }
    return {
      action: "respond",
      response: {
        statusCode: options.statusCode,
        statusDescription: statusDescriptions[options.statusCode],
        headers,
        ...options.body !== void 0 ? { body: options.body } : {}
      }
    };
  };
}



exports.constructResponse = constructResponse;
