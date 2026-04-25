"use strict";Object.defineProperty(exports, "__esModule", {value: true});

var _chunkSP7PJSDJcjs = require('./chunk-SP7PJSDJ.cjs');

// src/criteria/path-matches.ts
function pathMatches(...patterns) {
  return (req) => {
    const path = req.uri.split("?")[0];
    return _chunkSP7PJSDJcjs.matchesAnyWildcard.call(void 0, path, patterns);
  };
}



exports.pathMatches = pathMatches;
