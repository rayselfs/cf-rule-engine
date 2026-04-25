import { CriteriaFn } from '../core/types.cjs';

declare function pathPrefix(...prefixes: string[]): CriteriaFn;

export { pathPrefix };
