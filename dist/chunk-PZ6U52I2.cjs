"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }// src/behaviors/image-optimize.ts
function selectBreakpoint(width, breakpoints) {
  const sorted = [...breakpoints].sort((a, b) => a - b);
  for (const bp of sorted) {
    if (bp >= width) return bp;
  }
  return sorted[sorted.length - 1];
}
function selectFormat(acceptHeader, formats) {
  if (acceptHeader) {
    for (const fmt of formats) {
      if (fmt === "avif" && acceptHeader.includes("image/avif")) return "avif";
      if (fmt === "webp" && acceptHeader.includes("image/webp")) return "webp";
    }
  }
  return _nullishCoalesce(formats[formats.length - 1], () => ( "jpeg"));
}
function imageOptimize(options) {
  const formats = _nullishCoalesce(options.formats, () => ( ["avif", "webp", "jpeg"]));
  const quality = _nullishCoalesce(options.quality, () => ( 85));
  const sortedBreakpoints = [...options.breakpoints].sort((a, b) => a - b);
  return (request) => {
    const acceptHeader = _optionalChain([request, 'access', _ => _.headers, 'access', _2 => _2["accept"], 'optionalAccess', _3 => _3.value]);
    const format = selectFormat(acceptHeader, formats);
    const widthStr = _optionalChain([request, 'access', _4 => _4.headers, 'access', _5 => _5["cloudfront-viewer-width"], 'optionalAccess', _6 => _6.value]);
    const width = widthStr ? parseInt(widthStr, 10) : NaN;
    const breakpoint = Number.isFinite(width) ? selectBreakpoint(width, sortedBreakpoints) : sortedBreakpoints[sortedBreakpoints.length - 1];
    const uri = `${options.serviceEndpoint}/rs:fit:${breakpoint}/f:${format}/q:${quality}/plain/${options.sourceBaseUrl}${request.uri}`;
    return { action: "continue", request: { ...request, uri } };
  };
}



exports.imageOptimize = imageOptimize;
