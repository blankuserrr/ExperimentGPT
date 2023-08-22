import { RequestContext, ResponseContext } from './http/http.js';
import { Observable } from './rxjsStub.js';
export interface Middleware {
    pre(context: RequestContext): Observable<RequestContext>;
    post(context: ResponseContext): Observable<ResponseContext>;
}
export declare class PromiseMiddlewareWrapper implements Middleware {
    private middleware;
    constructor(middleware: PromiseMiddleware);
    pre(context: RequestContext): Observable<RequestContext>;
    post(context: ResponseContext): Observable<ResponseContext>;
}
export interface PromiseMiddleware {
    pre(context: RequestContext): Promise<RequestContext>;
    post(context: ResponseContext): Promise<ResponseContext>;
}
