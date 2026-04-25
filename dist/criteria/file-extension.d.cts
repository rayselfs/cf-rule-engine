import { CriteriaFn } from '../core/types.cjs';

declare function fileExtension(...extensions: string[]): CriteriaFn;

export { fileExtension };
