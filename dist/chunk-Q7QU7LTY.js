// src/behaviors/strip-query-params.ts
function stripQueryParams(...params) {
  return (request) => {
    const querystring = { ...request.querystring };
    for (const param of params) {
      delete querystring[param];
    }
    return { action: "continue", request: { ...request, querystring } };
  };
}

export {
  stripQueryParams
};
