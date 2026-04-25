// src/behaviors/set-request-header.ts
function setRequestHeader(headerName, value) {
  return (request) => {
    return {
      action: "continue",
      request: {
        ...request,
        headers: {
          ...request.headers,
          [headerName.toLowerCase()]: { value }
        }
      }
    };
  };
}

export {
  setRequestHeader
};
