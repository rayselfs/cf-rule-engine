"use strict";Object.defineProperty(exports, "__esModule", {value: true});// src/behaviors/set-csp.ts
function setCsp(options) {
  const cspValue = Object.entries(options.directives).map(([directive, value]) => `${directive} ${value}`).join("; ");
  return (_request, response) => {
    return {
      ...response,
      headers: {
        ...response.headers,
        "content-security-policy": { value: cspValue }
      }
    };
  };
}



exports.setCsp = setCsp;
