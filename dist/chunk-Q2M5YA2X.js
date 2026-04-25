// src/criteria/country-is.ts
function countryIs(...codes) {
  return (req) => {
    const country = req.headers["cloudfront-viewer-country"]?.value?.toUpperCase();
    if (!country) return false;
    return codes.some((c) => c.toUpperCase() === country);
  };
}

export {
  countryIs
};
