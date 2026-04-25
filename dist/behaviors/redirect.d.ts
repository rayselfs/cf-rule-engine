import { BehaviorFn } from '../core/types.js';

interface RedirectOptions {
    preserveQuerystring?: boolean;
}
declare function redirect(statusCode: 301 | 302 | 307, location: string, options?: RedirectOptions): BehaviorFn;

export { type RedirectOptions, redirect };
