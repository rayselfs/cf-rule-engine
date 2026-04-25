// src/behaviors/set-security-headers.ts
function setSecurityHeaders(options) {
  const hsts = options?.hsts ?? "max-age=31536000; includeSubDomains";
  const xFrameOptions = options?.xFrameOptions ?? "SAMEORIGIN";
  const xContentTypeOptions = options?.xContentTypeOptions ?? "nosniff";
  return (_request, response) => {
    return {
      ...response,
      headers: {
        ...response.headers,
        "strict-transport-security": { value: hsts },
        "x-frame-options": { value: xFrameOptions },
        "x-content-type-options": { value: xContentTypeOptions }
      }
    };
  };
}

export {
  setSecurityHeaders
};
