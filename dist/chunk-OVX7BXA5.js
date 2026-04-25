// src/criteria/method-is.ts
function methodIs(...methods) {
  return (req) => {
    const method = req.method.toUpperCase();
    return methods.some((m) => m.toUpperCase() === method);
  };
}

export {
  methodIs
};
