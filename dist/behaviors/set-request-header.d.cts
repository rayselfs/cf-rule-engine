import { BehaviorFn } from '../core/types.cjs';

declare function setRequestHeader(headerName: string, value: string): BehaviorFn;

export { setRequestHeader };
