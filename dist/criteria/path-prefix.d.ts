import { CriteriaFn } from '../core/types.js';

declare function pathPrefix(...prefixes: string[]): CriteriaFn;

export { pathPrefix };
