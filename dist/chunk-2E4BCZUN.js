import {
  matchesAnyCidr
} from "./chunk-EEDGKTMG.js";

// src/criteria/ip-cidr.ts
function ipCidr(...cidrs) {
  return (req) => matchesAnyCidr(req.clientIp, cidrs);
}

export {
  ipCidr
};
