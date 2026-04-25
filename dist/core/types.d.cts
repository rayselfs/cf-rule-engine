interface HttpRequest {
    uri: string;
    method: string;
    protocol: string;
    querystring: Record<string, {
        value: string;
    }>;
    headers: Record<string, {
        value: string;
    }>;
    clientIp: string;
    country?: string;
}
interface HttpResponse {
    statusCode: number;
    statusDescription?: string;
    headers: Record<string, {
        value: string;
    }>;
    body?: string;
}
type CriteriaFn = (request: HttpRequest) => boolean;
type BehaviorResult = {
    action: 'continue';
    request: HttpRequest;
} | {
    action: 'respond';
    response: HttpResponse;
};
type BehaviorFn = (request: HttpRequest) => BehaviorResult;
type ResponseBehaviorFn = (request: HttpRequest, response: HttpResponse) => HttpResponse;
interface Rule {
    criteria?: CriteriaFn;
    behavior: BehaviorFn;
}
type ViewerRequestHandler = (event: unknown) => unknown;
type ViewerResponseHandler = (event: unknown) => unknown;

export type { BehaviorFn, BehaviorResult, CriteriaFn, HttpRequest, HttpResponse, ResponseBehaviorFn, Rule, ViewerRequestHandler, ViewerResponseHandler };
