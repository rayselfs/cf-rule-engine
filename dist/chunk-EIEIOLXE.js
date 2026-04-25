// src/behaviors/set-cache-control.ts
function setCacheControl(value) {
  return (_request, response) => {
    return {
      ...response,
      headers: {
        ...response.headers,
        "cache-control": { value }
      }
    };
  };
}

export {
  setCacheControl
};
