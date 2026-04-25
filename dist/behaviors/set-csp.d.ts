import { ResponseBehaviorFn } from '../core/types.js';

interface CspOptions {
    directives: Record<string, string>;
}
declare function setCsp(options: CspOptions): ResponseBehaviorFn;

export { type CspOptions, setCsp };
