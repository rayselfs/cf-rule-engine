// src/behaviors/set-cors-headers.ts
function matchesOriginPattern(origin, pattern) {
  if (pattern === "*") return true;
  if (!pattern.includes("*")) return origin === pattern;
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`).test(origin);
}
function setCorsHeaders(options) {
  const allowedOrigins = options?.allowedOrigins ?? ["*"];
  const allowedMethods = options?.allowedMethods ?? "GET, POST, OPTIONS";
  const allowedHeaders = options?.allowedHeaders ?? "Content-Type, Cache-Control, Pragma, Range";
  return (request, response) => {
    let allowOrigin = allowedOrigins[0] ?? "*";
    if (options?.allowOriginEcho) {
      const originHeader = request.headers["origin"]?.value;
      if (originHeader && allowedOrigins.some((p) => matchesOriginPattern(originHeader, p))) {
        allowOrigin = originHeader;
      }
    }
    const corsHeaders = {
      "access-control-allow-origin": { value: allowOrigin },
      "access-control-allow-methods": { value: allowedMethods },
      "access-control-allow-headers": { value: allowedHeaders }
    };
    if (options?.allowCredentials) {
      corsHeaders["access-control-allow-credentials"] = { value: "true" };
    }
    if (options?.maxAge !== void 0) {
      corsHeaders["access-control-max-age"] = { value: String(options.maxAge) };
    }
    return {
      ...response,
      headers: { ...response.headers, ...corsHeaders }
    };
  };
}

export {
  setCorsHeaders
};
