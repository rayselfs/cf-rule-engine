import { BehaviorFn } from '../core/types.js';

declare function setRequestHeader(headerName: string, value: string): BehaviorFn;

export { setRequestHeader };
