import type { BehaviorFn, HttpRequest } from '../core/types.js'

/** Rewrite mode: 'set' to replace entirely, 'replace' for substring replacement, 'prepend' to add a prefix, 'regex-replace' for pattern matching. */
export type RewriteMode = 'set' | 'replace' | 'prepend' | 'regex-replace'

/** Rewrites the request URI using the specified mode and target value. */
export function rewriteUri(mode: RewriteMode, target: string, match?: string): BehaviorFn {
  return (request: HttpRequest) => {
    let uri = request.uri
    switch (mode) {
      case 'set':
        uri = target
        break
      case 'prepend':
        uri = target + uri
        break
      case 'replace':
        if (match !== undefined) {
          uri = uri.split(match).join(target)
        }
        break
      case 'regex-replace':
        if (match !== undefined) {
          uri = uri.replace(new RegExp(match, 'g'), target)
        }
        break
    }
    return { action: 'continue', request: { ...request, uri } }
  }
}
