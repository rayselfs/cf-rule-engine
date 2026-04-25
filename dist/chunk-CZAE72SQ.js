// src/criteria/header-contains.ts
function headerContains(headerName, ...substrings) {
  return (req) => {
    const val = req.headers[headerName.toLowerCase()]?.value;
    if (val === void 0) return false;
    const lower = val.toLowerCase();
    return substrings.some((s) => lower.includes(s.toLowerCase()));
  };
}

export {
  headerContains
};
