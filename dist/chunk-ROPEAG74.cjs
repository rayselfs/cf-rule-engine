"use strict";Object.defineProperty(exports, "__esModule", {value: true});// src/behaviors/rewrite-uri.ts
function rewriteUri(mode, target, match) {
  return (request) => {
    let uri = request.uri;
    switch (mode) {
      case "set":
        uri = target;
        break;
      case "prepend":
        uri = target + uri;
        break;
      case "replace":
        if (match !== void 0) {
          uri = uri.split(match).join(target);
        }
        break;
      case "regex-replace":
        if (match !== void 0) {
          uri = uri.replace(new RegExp(match, "g"), target);
        }
        break;
    }
    return { action: "continue", request: { ...request, uri } };
  };
}



exports.rewriteUri = rewriteUri;
