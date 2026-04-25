import { Rule, ResponseBehaviorFn } from './core/types.js';

declare function defineViewerRequest(rules: Rule[]): (event: unknown) => unknown;
declare function defineViewerResponse(responseBehaviors: ResponseBehaviorFn[]): (event: unknown) => unknown;

declare const lambdaEdge_defineViewerRequest: typeof defineViewerRequest;
declare const lambdaEdge_defineViewerResponse: typeof defineViewerResponse;
declare namespace lambdaEdge {
  export { lambdaEdge_defineViewerRequest as defineViewerRequest, lambdaEdge_defineViewerResponse as defineViewerResponse };
}

export { defineViewerResponse as a, defineViewerRequest as d, lambdaEdge as l };
