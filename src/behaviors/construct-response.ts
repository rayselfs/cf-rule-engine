import type { BehaviorFn } from '../core/types.js'

/** Options for constructing a response: status code, optional body, content type, and custom headers. */
export interface ConstructResponseOptions {
  statusCode: number
  body?: string
  contentType?: string
  headers?: Record<string, string>
}

const statusDescriptions: Record<number, string> = {
  200: 'OK',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
}

/** Constructs and responds with an HTTP response having the specified status code, body, and headers. */
export function constructResponse(options: ConstructResponseOptions): BehaviorFn {
  return () => {
    const headers: Record<string, { value: string }> = {
      'cache-control': { value: 'no-store' },
    }
    if (options.contentType) {
      headers['content-type'] = { value: options.contentType }
    }
    if (options.headers) {
      const headerEntries = Object.entries(options.headers)
      for (let i = 0; i < headerEntries.length; i++) {
        const [k, v] = headerEntries[i]
        headers[k.toLowerCase()] = { value: v }
      }
    }
    return {
      action: 'respond',
      response: {
        statusCode: options.statusCode,
        statusDescription: statusDescriptions[options.statusCode],
        headers,
        ...(options.body !== undefined ? { body: options.body } : {}),
      },
    }
  }
}
