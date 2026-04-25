import { CriteriaFn } from '../core/types.js';

declare function fileExtension(...extensions: string[]): CriteriaFn;

export { fileExtension };
