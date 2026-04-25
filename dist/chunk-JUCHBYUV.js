// src/criteria/path-equals.ts
function pathEquals(...paths) {
  return (req) => paths.some((p) => req.uri === p);
}

export {
  pathEquals
};
