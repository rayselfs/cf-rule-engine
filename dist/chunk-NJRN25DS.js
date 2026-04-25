// src/criteria/path-prefix.ts
function pathPrefix(...prefixes) {
  return (req) => prefixes.some((p) => req.uri.startsWith(p));
}

export {
  pathPrefix
};
