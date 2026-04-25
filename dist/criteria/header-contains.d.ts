import { CriteriaFn } from '../core/types.js';

declare function headerContains(headerName: string, ...substrings: string[]): CriteriaFn;

export { headerContains };
