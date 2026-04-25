import { BehaviorFn } from '../core/types.cjs';

interface ConstructResponseOptions {
    statusCode: number;
    body?: string;
    contentType?: string;
    headers?: Record<string, string>;
}
declare function constructResponse(options: ConstructResponseOptions): BehaviorFn;

export { type ConstructResponseOptions, constructResponse };
