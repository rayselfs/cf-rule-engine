"use strict";Object.defineProperty(exports, "__esModule", {value: true});// src/shared/wildcard.ts
var regexCache = /* @__PURE__ */ new Map();
function wildcardToRegex(pattern) {
  if (!regexCache.has(pattern)) {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
    regexCache.set(pattern, new RegExp(`^${escaped}$`, "i"));
  }
  return regexCache.get(pattern);
}
function matchesWildcard(str, pattern) {
  return wildcardToRegex(pattern).test(str);
}
function matchesAnyWildcard(str, patterns) {
  return patterns.some((p) => matchesWildcard(str, p));
}





exports.wildcardToRegex = wildcardToRegex; exports.matchesWildcard = matchesWildcard; exports.matchesAnyWildcard = matchesAnyWildcard;
