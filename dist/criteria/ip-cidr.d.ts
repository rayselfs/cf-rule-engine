import { CriteriaFn } from '../core/types.js';

declare function ipCidr(...cidrs: string[]): CriteriaFn;

export { ipCidr };
