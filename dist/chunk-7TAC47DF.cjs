"use strict";Object.defineProperty(exports, "__esModule", {value: true});// src/behaviors/set-cache-control.ts
function setCacheControl(value) {
  return (_request, response) => {
    return {
      ...response,
      headers: {
        ...response.headers,
        "cache-control": { value }
      }
    };
  };
}



exports.setCacheControl = setCacheControl;
