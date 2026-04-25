import type { BehaviorFn, HttpRequest } from '../core/types.js'

/**
 * Options for configuring redirect behavior.
 */
export interface RedirectOptions {
  /**
   * When `true`, the original request's query string is appended to the redirect
   * `location` URL. Useful for preserving search params during path migrations.
   * Default: `false`.
   */
  preserveQuerystring?: boolean
}

const statusDescriptions: Record<301 | 302 | 307, string> = {
  301: 'Moved Permanently',
  302: 'Found',
  307: 'Temporary Redirect',
}

/**
 * Redirects the request to the specified URL with the given HTTP status code.
 *
 * The response always includes `Cache-Control: no-store` to prevent clients
 * from caching the redirect.
 *
 * Akamai equivalent: `redirect` / `redirectplus` behaviors.
 *
 * @param statusCode - The HTTP redirect status code: `301` (permanent), `302` (temporary),
 *   or `307` (temporary, preserves method).
 * @param location - The target URL to redirect to. Can be an absolute URL
 *   (e.g. `'https://www.example.com/new-path'`) or an absolute path (e.g. `'/new-path'`).
 * @param options - Optional settings, e.g. to preserve the original query string.
 * @returns A `BehaviorFn` to use as the second argument to `rule()`.
 *
 * @example
 * ```ts
 * import { redirect } from '@rayselfs/cf-rule-engine/behaviors'
 * import { pathPrefix, pathEquals } from '@rayselfs/cf-rule-engine/criteria'
 * import { rule } from '@rayselfs/cf-rule-engine'
 *
 * // Permanent redirect for a renamed section
 * rule(pathPrefix(['/old-blog/']), redirect(301, '/blog/'))
 *
 * // Temporary redirect preserving query string
 * rule(pathEquals(['/search']), redirect(302, '/new-search', { preserveQuerystring: true }))
 * ```
 */
export function redirect(
  statusCode: 301 | 302 | 307,
  location: string,
  options?: RedirectOptions,
): BehaviorFn {
  return (request: HttpRequest) => {
    let finalLocation = location
    if (options?.preserveQuerystring) {
      const qsEntries = Object.entries(request.querystring)
      const qsParts: string[] = []
      for (let i = 0; i < qsEntries.length; i++) {
        const entry = qsEntries[i]
        qsParts.push(entry[0] + '=' + entry[1].value)
      }
      const qs = qsParts.join('&')
      if (qs) {
        finalLocation = `${location}?${qs}`
      }
    }
    return {
      action: 'respond',
      response: {
        statusCode,
        statusDescription: statusDescriptions[statusCode],
        headers: {
          location: { value: finalLocation },
          'cache-control': { value: 'no-store' },
        },
      },
    }
  }
}
