import { ResponseBehaviorFn } from '../core/types.cjs';

interface SecurityHeadersOptions {
    hsts?: string;
    xFrameOptions?: string;
    xContentTypeOptions?: string;
}
declare function setSecurityHeaders(options?: SecurityHeadersOptions): ResponseBehaviorFn;

export { type SecurityHeadersOptions, setSecurityHeaders };
