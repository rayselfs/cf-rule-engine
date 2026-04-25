import { CriteriaFn } from '../core/types.cjs';

declare function userAgentMatches(...patterns: string[]): CriteriaFn;

export { userAgentMatches };
