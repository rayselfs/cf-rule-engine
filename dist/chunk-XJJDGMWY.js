// src/behaviors/set-response-header.ts
function setResponseHeader(headerName, value) {
  return (_request, response) => {
    return {
      ...response,
      headers: {
        ...response.headers,
        [headerName.toLowerCase()]: { value }
      }
    };
  };
}

export {
  setResponseHeader
};
