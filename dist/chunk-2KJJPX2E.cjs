"use strict";Object.defineProperty(exports, "__esModule", {value: true});// src/criteria/path-prefix.ts
function pathPrefix(...prefixes) {
  return (req) => prefixes.some((p) => req.uri.startsWith(p));
}



exports.pathPrefix = pathPrefix;
