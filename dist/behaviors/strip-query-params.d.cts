import { BehaviorFn } from '../core/types.cjs';

declare function stripQueryParams(...params: string[]): BehaviorFn;

export { stripQueryParams };
