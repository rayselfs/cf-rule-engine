import type { BehaviorFn, HttpRequest } from '../core/types.js'

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
 * @returns A `BehaviorFn` to use as the second argument to `rule()`.
 *
 * @example
 * ```ts
 * import { redirect } from '@rayselfs/cf-rule-engine/behaviors/redirect'
 * import { pathPrefix, pathEquals } from '@rayselfs/cf-rule-engine/criteria'
 * import { rule } from '@rayselfs/cf-rule-engine'
 *
 * rule(pathPrefix(['/old-blog/']), redirect(301, '/blog/'))
 * rule(pathEquals(['/search']), redirect(302, '/new-search'))
 * ```
 */
export function redirect(statusCode: 301 | 302 | 307, location: string): BehaviorFn {
  return () => ({
    action: 'respond',
    response: {
      statusCode,
      statusDescription: statusDescriptions[statusCode],
      headers: {
        location: { value: location },
        'cache-control': { value: 'no-store' },
      },
    },
  })
}

/**
 * Redirects the request to the specified URL, appending the original query string.
 *
 * Use this instead of `redirect` when you need to preserve search parameters during
 * path migrations. If the request has no query string the redirect target is unchanged.
 *
 * @param statusCode - The HTTP redirect status code: `301`, `302`, or `307`.
 * @param location - The base redirect URL (query string will be appended).
 * @returns A `BehaviorFn` to use as the second argument to `rule()`.
 *
 * @example
 * ```ts
 * import { redirectWithQs } from '@rayselfs/cf-rule-engine/behaviors/redirect'
 * import { pathEquals } from '@rayselfs/cf-rule-engine/criteria'
 * import { rule } from '@rayselfs/cf-rule-engine'
 *
 * rule(pathEquals(['/search']), redirectWithQs(302, '/new-search'))
 * ```
 */
export function redirectWithQs(statusCode: 301 | 302 | 307, location: string): BehaviorFn {
  return (request: HttpRequest) => {
    const qsEntries = Object.entries(request.querystring)
    const qsParts: string[] = []
    for (let i = 0; i < qsEntries.length; i++) {
      const entry = qsEntries[i]
      qsParts.push(entry[0] + '=' + entry[1].value)
    }
    const qs = qsParts.join('&')
    const finalLocation = qs ? `${location}?${qs}` : location
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
