"use strict";Object.defineProperty(exports, "__esModule", {value: true});// src/shared/cidr.ts
function ipToInt(ip) {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10) >>> 0, 0);
}
function inCidr(ip, cidr) {
  const [range, bits = "32"] = cidr.split("/");
  const mask = bits === "0" ? 0 : ~0 << 32 - parseInt(bits, 10) >>> 0;
  return (ipToInt(ip) & mask) === (ipToInt(range) & mask);
}
function matchesAnyCidr(ip, cidrs) {
  return cidrs.some((cidr) => inCidr(ip, cidr));
}





exports.ipToInt = ipToInt; exports.inCidr = inCidr; exports.matchesAnyCidr = matchesAnyCidr;
