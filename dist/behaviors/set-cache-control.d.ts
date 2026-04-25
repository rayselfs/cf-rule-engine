import { ResponseBehaviorFn } from '../core/types.js';

declare function setCacheControl(value: string): ResponseBehaviorFn;

export { setCacheControl };
