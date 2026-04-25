import { ResponseBehaviorFn } from '../core/types.js';

declare function removeResponseHeaders(...headerNames: string[]): ResponseBehaviorFn;

export { removeResponseHeaders };
