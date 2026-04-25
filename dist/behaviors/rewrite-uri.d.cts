import { BehaviorFn } from '../core/types.cjs';

type RewriteMode = 'set' | 'replace' | 'prepend' | 'regex-replace';
declare function rewriteUri(mode: RewriteMode, target: string, match?: string): BehaviorFn;

export { type RewriteMode, rewriteUri };
