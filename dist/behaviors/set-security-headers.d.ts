import { ResponseBehaviorFn } from '../core/types.js';

interface SecurityHeadersOptions {
    hsts?: string;
    xFrameOptions?: string;
    xContentTypeOptions?: string;
}
declare function setSecurityHeaders(options?: SecurityHeadersOptions): ResponseBehaviorFn;

export { type SecurityHeadersOptions, setSecurityHeaders };
