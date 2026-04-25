import {
  matchesAnyWildcard
} from "./chunk-EWTHVDBA.js";

// src/criteria/path-matches.ts
function pathMatches(...patterns) {
  return (req) => {
    const path = req.uri.split("?")[0];
    return matchesAnyWildcard(path, patterns);
  };
}

export {
  pathMatches
};
