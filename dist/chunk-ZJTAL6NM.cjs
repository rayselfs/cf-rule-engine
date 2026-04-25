"use strict";Object.defineProperty(exports, "__esModule", {value: true});// src/criteria/method-is.ts
function methodIs(...methods) {
  return (req) => {
    const method = req.method.toUpperCase();
    return methods.some((m) => m.toUpperCase() === method);
  };
}



exports.methodIs = methodIs;
