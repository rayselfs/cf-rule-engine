import { CriteriaFn, BehaviorFn, Rule, HttpRequest, BehaviorResult } from './types.cjs';

declare function rule(behavior: BehaviorFn): Rule;
declare function rule(criteria: CriteriaFn, behavior: BehaviorFn): Rule;
declare function all(...fns: CriteriaFn[]): CriteriaFn;
declare function any(...fns: CriteriaFn[]): CriteriaFn;
declare function not(fn: CriteriaFn): CriteriaFn;
declare function runRules(rules: Rule[], request: HttpRequest): BehaviorResult;

export { all, any, not, rule, runRules };
