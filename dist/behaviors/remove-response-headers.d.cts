import { ResponseBehaviorFn } from '../core/types.cjs';

declare function removeResponseHeaders(...headerNames: string[]): ResponseBehaviorFn;

export { removeResponseHeaders };
