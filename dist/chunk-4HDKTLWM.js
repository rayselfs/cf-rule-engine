// src/behaviors/image-optimize.ts
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
  return formats[formats.length - 1] ?? "jpeg";
}
function imageOptimize(options) {
  const formats = options.formats ?? ["avif", "webp", "jpeg"];
  const quality = options.quality ?? 85;
  const sortedBreakpoints = [...options.breakpoints].sort((a, b) => a - b);
  return (request) => {
    const acceptHeader = request.headers["accept"]?.value;
    const format = selectFormat(acceptHeader, formats);
    const widthStr = request.headers["cloudfront-viewer-width"]?.value;
    const width = widthStr ? parseInt(widthStr, 10) : NaN;
    const breakpoint = Number.isFinite(width) ? selectBreakpoint(width, sortedBreakpoints) : sortedBreakpoints[sortedBreakpoints.length - 1];
    const uri = `${options.serviceEndpoint}/rs:fit:${breakpoint}/f:${format}/q:${quality}/plain/${options.sourceBaseUrl}${request.uri}`;
    return { action: "continue", request: { ...request, uri } };
  };
}

export {
  imageOptimize
};
