import { CriteriaFn } from '../core/types.js';

declare function pathMatches(...patterns: string[]): CriteriaFn;

export { pathMatches };
