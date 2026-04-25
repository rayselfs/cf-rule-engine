import { ResponseBehaviorFn } from '../core/types.js';

interface CorsOptions {
    allowedOrigins?: string[];
    allowOriginEcho?: boolean;
    allowedMethods?: string;
    allowedHeaders?: string;
    allowCredentials?: boolean;
    maxAge?: number;
}
declare function setCorsHeaders(options?: CorsOptions): ResponseBehaviorFn;

export { type CorsOptions, setCorsHeaders };
