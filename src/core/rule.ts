import type { CriteriaFn, BehaviorFn, BehaviorResult, Rule, HttpRequest } from './types.js'

/**
 * Creates a rule that always runs the given behavior (no criteria guard).
 *
 * @param behavior - The behavior function to execute for every request.
 * @returns A `Rule` object to pass to `defineViewerRequest`.
 *
 * @example
 * ```ts
 * // Always set security headers, regardless of path
 * rule(setSecurityHeaders())
 * ```
 */
export function rule(behavior: BehaviorFn): Rule
/**
 * Creates a rule that runs the behavior only when the criteria returns `true`.
 *
 * @param criteria - Guard function; the behavior runs only when this returns `true`.
 * @param behavior - The behavior function to execute when criteria matches.
 * @returns A `Rule` object to pass to `defineViewerRequest`.
 *
 * @example
 * ```ts
 * // Redirect /old-path to /new-path
 * rule(pathPrefix(['/old-path']), redirect(301, '/new-path'))
 * ```
 */
export function rule(criteria: CriteriaFn, behavior: BehaviorFn): Rule
export function rule(criteriaOrBehavior: CriteriaFn | BehaviorFn, behavior?: BehaviorFn): Rule {
  if (behavior === undefined) {
    return { behavior: criteriaOrBehavior as BehaviorFn }
  }
  return { criteria: criteriaOrBehavior as CriteriaFn, behavior }
}

/**
 * Combines multiple criteria with AND logic — all must return `true`.
 *
 * @param fns - Array of criteria functions to evaluate.
 * @returns A `CriteriaFn` that returns `true` only when every function in `fns` returns `true`.
 *
 * @example
 * ```ts
 * rule(all([pathPrefix(['/api/']), methodIs(['POST'])]), constructResponse({ statusCode: 403 }))
 * ```
 */
export function all(fns: CriteriaFn[]): CriteriaFn {
  return (req) => fns.every(fn => fn(req))
}

/**
 * Combines multiple criteria with OR logic — at least one must return `true`.
 *
 * @param fns - Array of criteria functions to evaluate.
 * @returns A `CriteriaFn` that returns `true` when any function in `fns` returns `true`.
 *
 * @example
 * ```ts
 * rule(any([pathPrefix(['/admin/']), ipCidr(['10.0.0.0/8'])]), redirect(302, '/blocked'))
 * ```
 */
export function any(fns: CriteriaFn[]): CriteriaFn {
  return (req) => fns.some(fn => fn(req))
}

/**
 * Negates a criteria function — returns `true` when the wrapped function returns `false`.
 *
 * @param fn - The criteria function to negate.
 * @returns A `CriteriaFn` that returns the logical inverse of `fn`.
 *
 * @example
 * ```ts
 * // Block all non-internal IPs
 * rule(not(ipCidr(['10.0.0.0/8', '192.168.0.0/16'])), redirect(302, '/blocked'))
 * ```
 */
export function not(fn: CriteriaFn): CriteriaFn {
  return (req) => !fn(req)
}

/**
 * Chains multiple behavior functions sequentially, passing the mutated request
 * from each behavior to the next. Stops immediately if any behavior returns
 * `{ action: 'respond' }`.
 *
 * Use this when a single Akamai rule has multiple behaviors that must operate
 * on the same (possibly mutated) request. Without chaining, splitting behaviors
 * into separate `rule()` calls causes each to re-evaluate criteria against
 * the original request — breaking cases where behavior 1 rewrites the URI
 * and behavior 2 must see the rewritten path.
 *
 * @param behaviors - Ordered array of behavior functions to execute in sequence.
 * @returns A single `BehaviorFn` that runs all behaviors in order.
 *
 * @example
 * ```ts
 * rule(pathPrefix(['/api/']), chain([rewriteUri('replace', '/v2', '/api'), setRequestHeader('x-api-version', '2')]))
 * ```
 */
export function chain(behaviors: BehaviorFn[]): BehaviorFn {
  return (request) => {
    let current = request
    for (let i = 0; i < behaviors.length; i++) {
      const result = behaviors[i](current)
      if (result.action === 'respond') return result
      current = result.request
    }
    return { action: 'continue', request: current }
  }
}

/**
 * Executes an ordered list of rules against a request, stopping at the first
 * rule whose behavior returns `{ action: 'respond' }`.
 *
 * This is called internally by `defineViewerRequest`; you rarely need to call
 * it directly unless building a custom adapter.
 *
 * @param rules - Ordered array of rules to evaluate.
 * @param request - The normalized `HttpRequest` to process.
 * @returns A `BehaviorResult` — either `{ action: 'respond', response }` or
 *   `{ action: 'continue', request }` with the final mutated request.
 */
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
