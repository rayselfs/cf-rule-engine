import type { CriteriaFn, BehaviorFn, BehaviorResult, Rule, HttpRequest } from './types.js'

/** Creates a rule with optional criteria and a behavior function. */
export function rule(behavior: BehaviorFn): Rule
/** Creates a rule with criteria and a behavior function. */
export function rule(criteria: CriteriaFn, behavior: BehaviorFn): Rule
export function rule(criteriaOrBehavior: CriteriaFn | BehaviorFn, behavior?: BehaviorFn): Rule {
  if (behavior === undefined) {
    return { behavior: criteriaOrBehavior as BehaviorFn }
  }
  return { criteria: criteriaOrBehavior as CriteriaFn, behavior }
}

/** Combines multiple criteria functions with AND logic. */
export function all(...fns: CriteriaFn[]): CriteriaFn {
  return (req) => fns.every(fn => fn(req))
}

/** Combines multiple criteria functions with OR logic. */
export function any(...fns: CriteriaFn[]): CriteriaFn {
  return (req) => fns.some(fn => fn(req))
}

/** Negates a criteria function. */
export function not(fn: CriteriaFn): CriteriaFn {
  return (req) => !fn(req)
}

/** Executes rules against a request in order, stopping at first response or completing all. */
export function runRules(rules: Rule[], request: HttpRequest): BehaviorResult {
  for (let i = 0; i < rules.length; i++) {
    const r = rules[i]
    if (!r.criteria || r.criteria(request)) {
      const result = r.behavior(request)
      if (result.action === 'respond') return result
      request = result.request
    }
  }
  return { action: 'continue', request }
}
