// src/criteria/header-equals.ts
function headerEquals(headerName, ...values) {
  return (req) => {
    const val = req.headers[headerName.toLowerCase()]?.value;
    if (val === void 0) return false;
    return values.some((v) => v.toLowerCase() === val.toLowerCase());
  };
}

export {
  headerEquals
};
