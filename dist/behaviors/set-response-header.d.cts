import { ResponseBehaviorFn } from '../core/types.cjs';

declare function setResponseHeader(headerName: string, value: string): ResponseBehaviorFn;

export { setResponseHeader };
