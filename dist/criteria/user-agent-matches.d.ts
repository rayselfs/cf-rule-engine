import { CriteriaFn } from '../core/types.js';

declare function userAgentMatches(...patterns: string[]): CriteriaFn;

export { userAgentMatches };
