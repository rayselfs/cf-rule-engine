import { Rule, ResponseBehaviorFn } from './core/types.cjs';

declare function defineViewerRequest(rules: Rule[]): (event: unknown) => unknown;
declare function defineViewerResponse(responseBehaviors: ResponseBehaviorFn[]): (event: unknown) => unknown;

declare const cfFunction_defineViewerRequest: typeof defineViewerRequest;
declare const cfFunction_defineViewerResponse: typeof defineViewerResponse;
declare namespace cfFunction {
  export { cfFunction_defineViewerRequest as defineViewerRequest, cfFunction_defineViewerResponse as defineViewerResponse };
}

export { defineViewerResponse as a, cfFunction as c, defineViewerRequest as d };
