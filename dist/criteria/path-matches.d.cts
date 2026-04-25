import { CriteriaFn } from '../core/types.cjs';

declare function pathMatches(...patterns: string[]): CriteriaFn;

export { pathMatches };
