// src/criteria/file-extension.ts
function fileExtension(...extensions) {
  return (req) => {
    const path = req.uri.split("?")[0];
    const dot = path.lastIndexOf(".");
    if (dot === -1) return false;
    const ext = path.slice(dot + 1).toLowerCase();
    return extensions.some((e) => e.toLowerCase() === ext);
  };
}

export {
  fileExtension
};
