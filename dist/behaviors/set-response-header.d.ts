import { ResponseBehaviorFn } from '../core/types.js';

declare function setResponseHeader(headerName: string, value: string): ResponseBehaviorFn;

export { setResponseHeader };
