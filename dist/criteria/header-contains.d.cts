import { CriteriaFn } from '../core/types.cjs';

declare function headerContains(headerName: string, ...substrings: string[]): CriteriaFn;

export { headerContains };
