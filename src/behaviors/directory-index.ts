import type { BehaviorFn, HttpRequest } from '../core/types.js'

/** Manages directory index routing: appends index file to directory requests, redirects /path/index.html to /path/, and redirects /path to /path/. */
export function directoryIndex(indexFile: string = 'index.html'): BehaviorFn {
  return (request: HttpRequest) => {
    const uri = request.uri

    if (uri.endsWith('/')) {
      return { action: 'continue', request: { ...request, uri: uri + indexFile } }
    }

    if (uri.endsWith('/' + indexFile)) {
      const dirUri = uri.slice(0, uri.length - indexFile.length)
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
