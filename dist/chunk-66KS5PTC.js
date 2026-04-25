// src/core/rule.ts
function rule(criteriaOrBehavior, behavior) {
  if (behavior === void 0) {
    return { behavior: criteriaOrBehavior };
  }
  return { criteria: criteriaOrBehavior, behavior };
}
function all(...fns) {
  return (req) => fns.every((fn) => fn(req));
}
function any(...fns) {
  return (req) => fns.some((fn) => fn(req));
}
function not(fn) {
  return (req) => !fn(req);
}
function runRules(rules, request) {
  for (const r of rules) {
    if (!r.criteria || r.criteria(request)) {
      const result = r.behavior(request);
      if (result.action === "respond") return result;
      request = result.request;
    }
  }
  return { action: "continue", request };
}

export {
  rule,
  all,
  any,
  not,
  runRules
};
