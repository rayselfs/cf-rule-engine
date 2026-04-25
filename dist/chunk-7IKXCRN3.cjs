"use strict";Object.defineProperty(exports, "__esModule", {value: true});

var _chunkRLEHZH4Zcjs = require('./chunk-RLEHZH4Z.cjs');

// src/criteria/ip-cidr.ts
function ipCidr(...cidrs) {
  return (req) => _chunkRLEHZH4Zcjs.matchesAnyCidr.call(void 0, req.clientIp, cidrs);
}



exports.ipCidr = ipCidr;
