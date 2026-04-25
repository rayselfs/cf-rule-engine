import { CriteriaFn } from '../core/types.cjs';

declare function headerEquals(headerName: string, ...values: string[]): CriteriaFn;

export { headerEquals };
