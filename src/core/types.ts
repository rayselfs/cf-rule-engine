/** Represents an HTTP request with URI, method, headers, and querystring. */
export type HttpRequest = {
  uri: string
  method: string
  protocol: string
  querystring: Record<string, { value: string }>
  headers: Record<string, { value: string }>
  clientIp: string
  country?: string
}

/** Represents an HTTP response with status code and headers. */
export type HttpResponse = {
  statusCode: number
  statusDescription?: string
  headers: Record<string, { value: string }>
  body?: string
}

/** A function that evaluates criteria against a request and returns a boolean. */
export type CriteriaFn = (request: HttpRequest) => boolean

/** Result of a behavior function: either continue processing or respond. */
export type BehaviorResult =
  | { action: 'continue'; request: HttpRequest }
  | { action: 'respond'; response: HttpResponse }

/** A function that modifies a request and returns a BehaviorResult. */
export type BehaviorFn = (request: HttpRequest) => BehaviorResult

/** A function that modifies an HTTP response. */
export type ResponseBehaviorFn = (request: HttpRequest, response: HttpResponse) => HttpResponse

/** A response rule: an optional criteria guard plus a ResponseBehaviorFn. */
export type ResponseRule = {
  criteria?: CriteriaFn
  behavior: ResponseBehaviorFn
}

/** A rule combining optional criteria and a behavior function. */
export type Rule = {
  criteria?: CriteriaFn
  behavior: BehaviorFn
}

/** Handler for CloudFront viewer request events. */
export type ViewerRequestHandler = (event: unknown) => unknown
/** Handler for CloudFront viewer response events. */
export type ViewerResponseHandler = (event: unknown) => unknown
