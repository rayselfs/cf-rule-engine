import {
  matchesAnyWildcard
} from "./chunk-EWTHVDBA.js";

// src/criteria/user-agent-matches.ts
function userAgentMatches(...patterns) {
  return (req) => {
    const ua = req.headers["user-agent"]?.value;
    if (!ua) return false;
    return matchesAnyWildcard(ua, patterns);
  };
}

export {
  userAgentMatches
};
