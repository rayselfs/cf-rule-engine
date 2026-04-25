"use strict";Object.defineProperty(exports, "__esModule", {value: true});// src/criteria/path-equals.ts
function pathEquals(...paths) {
  return (req) => paths.some((p) => req.uri === p);
}



exports.pathEquals = pathEquals;
