import type { BehaviorFn, HttpRequest } from '../core/types.js'

/** Manages directory index routing: appends index file to directory requests, redirects /path/index.html to /path/, and redirects /path to /path/. */
export function directoryIndex(indexFile?: string): BehaviorFn {
  const file = indexFile || 'index.html'
  return (request: HttpRequest) => {
    const uri = request.uri

    if (uri.endsWith('/')) {
      return { action: 'continue', request: Object.assign({}, request, { uri: uri + file }) }
    }

    if (uri.endsWith('/' + file)) {
      const dirUri = uri.slice(0, uri.length - file.length)
      return {
        action: 'respond',
        response: {
          statusCode: 301,
          statusDescription: 'Moved Permanently',
          headers: {
            location: { value: dirUri },
            'cache-control': { value: 'no-store' },
          },
        },
      }
    }

    // matches path segments with no file extension: e.g. /foo/bar but not /foo/bar.html
    if (/\/[^/.]+$/.test(uri)) {
      return {
        action: 'respond',
        response: {
          statusCode: 301,
          statusDescription: 'Moved Permanently',
          headers: {
            location: { value: uri + '/' },
            'cache-control': { value: 'no-store' },
          },
        },
      }
    }

    return { action: 'continue', request }
  }
}
