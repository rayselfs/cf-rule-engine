import { ResponseBehaviorFn } from '../core/types.cjs';

interface CspOptions {
    directives: Record<string, string>;
}
declare function setCsp(options: CspOptions): ResponseBehaviorFn;

export { type CspOptions, setCsp };
