import { BehaviorFn } from '../core/types.js';

declare function stripQueryParams(...params: string[]): BehaviorFn;

export { stripQueryParams };
