import { CriteriaFn } from '../core/types.js';

declare function headerEquals(headerName: string, ...values: string[]): CriteriaFn;

export { headerEquals };
