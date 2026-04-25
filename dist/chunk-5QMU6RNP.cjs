"use strict";Object.defineProperty(exports, "__esModule", {value: true});// src/behaviors/remove-response-headers.ts
function removeResponseHeaders(...headerNames) {
  return (_request, response) => {
    const headers = { ...response.headers };
    for (const name of headerNames) {
      delete headers[name.toLowerCase()];
    }
    return { ...response, headers };
  };
}



exports.removeResponseHeaders = removeResponseHeaders;
