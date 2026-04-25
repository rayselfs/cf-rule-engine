import { BehaviorFn } from '../core/types.js';

interface ImageOptimizeOptions {
    breakpoints: number[];
    formats?: ('avif' | 'webp' | 'jpeg')[];
    quality?: number;
    serviceEndpoint: string;
    sourceBaseUrl: string;
}
declare function imageOptimize(options: ImageOptimizeOptions): BehaviorFn;

export { type ImageOptimizeOptions, imageOptimize };
