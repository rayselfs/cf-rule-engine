"use strict";Object.defineProperty(exports, "__esModule", {value: true});// src/behaviors/directory-index.ts
function directoryIndex(indexFile = "index.html") {
  return (request) => {
    const uri = request.uri;
    if (uri.endsWith("/")) {
      return { action: "continue", request: { ...request, uri: uri + indexFile } };
    }
    if (uri.endsWith("/" + indexFile)) {
      const dirUri = uri.slice(0, uri.length - indexFile.length);
      return {
        action: "respond",
        response: {
          statusCode: 301,
          statusDescription: "Moved Permanently",
          headers: {
            location: { value: dirUri },
            "cache-control": { value: "no-store" }
          }
        }
      };
    }
    if (/\/[^/.]+$/.test(uri)) {
      return {
        action: "respond",
        response: {
          statusCode: 301,
          statusDescription: "Moved Permanently",
          headers: {
            location: { value: uri + "/" },
            "cache-control": { value: "no-store" }
          }
        }
      };
    }
    return { action: "continue", request };
  };
}



exports.directoryIndex = directoryIndex;
