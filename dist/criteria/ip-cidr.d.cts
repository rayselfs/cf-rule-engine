import { CriteriaFn } from '../core/types.cjs';

declare function ipCidr(...cidrs: string[]): CriteriaFn;

export { ipCidr };
