// src/criteria/hostname-is.ts
function hostnameIs(...hostnames) {
  return (req) => {
    const host = req.headers["host"]?.value?.toLowerCase();
    if (!host) return false;
    return hostnames.some((h) => h.toLowerCase() === host);
  };
}

export {
  hostnameIs
};
