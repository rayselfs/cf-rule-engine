// src/behaviors/redirect.ts
var statusDescriptions = {
  301: "Moved Permanently",
  302: "Found",
  307: "Temporary Redirect"
};
function redirect(statusCode, location, options) {
  return (request) => {
    let finalLocation = location;
    if (options?.preserveQuerystring) {
      const qs = Object.entries(request.querystring).map(([k, v]) => `${k}=${v.value}`).join("&");
      if (qs) {
        finalLocation = `${location}?${qs}`;
      }
    }
    return {
      action: "respond",
      response: {
        statusCode,
        statusDescription: statusDescriptions[statusCode],
        headers: {
          location: { value: finalLocation },
          "cache-control": { value: "no-store" }
        }
      }
    };
  };
}

export {
  redirect
};
