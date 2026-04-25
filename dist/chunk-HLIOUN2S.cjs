"use strict";Object.defineProperty(exports, "__esModule", {value: true});// src/behaviors/set-response-header.ts
function setResponseHeader(headerName, value) {
  return (_request, response) => {
    return {
      ...response,
      headers: {
        ...response.headers,
        [headerName.toLowerCase()]: { value }
      }
    };
  };
}



exports.setResponseHeader = setResponseHeader;
