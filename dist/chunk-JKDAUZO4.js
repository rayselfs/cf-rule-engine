// src/behaviors/copy-header.ts
function copyHeader(sourceHeader, targetHeader) {
  return (request) => {
    const sourceValue = request.headers[sourceHeader.toLowerCase()]?.value;
    if (sourceValue === void 0) {
      return { action: "continue", request };
    }
    return {
      action: "continue",
      request: {
        ...request,
        headers: {
          ...request.headers,
          [targetHeader.toLowerCase()]: { value: sourceValue }
        }
      }
    };
  };
}

export {
  copyHeader
};
