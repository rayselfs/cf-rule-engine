import { ResponseBehaviorFn } from '../core/types.cjs';

declare function setCacheControl(value: string): ResponseBehaviorFn;

export { setCacheControl };
