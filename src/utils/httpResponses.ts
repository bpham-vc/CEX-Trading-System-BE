import { Response } from "express";

/**
 * See https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
 *
 * @export
 * @enum {number}
 */
export enum HttpStatusCodes {
  // Good
  OK = 200,
  Created = 201,
  Accepted = 202,

  MultipleChoices = 300,
  MovedPermanently = 301,
  Found = 302,
  SeeOther = 303,
  NotModified = 304,

  // Bad
  BadRequest = 400,
  Unauthorized = 401,
  PaymentRequired = 402,
  Forbidden = 403,
  NotFound = 404,
  MethodNotAllowed = 405,
  NotAcceptable = 406,
  ProxyAuthRequired = 407,
  RequestTimeout = 408,
  Conflict = 409,
  Gone = 410,

  InternalServerError = 500,
}

export function okay(res: Response, content?: any) {
  res.status(HttpStatusCodes.OK).json(content);
}

export function created(res: Response, content?: any) {
  res.status(HttpStatusCodes.Created).json(content);
}

export function updated(res: Response, content: any) {
  res.status(HttpStatusCodes.OK).json(content);
}

export function forbidden(res: Response, content?: any) {
  res.status(HttpStatusCodes.Forbidden).json(content);
}

export function unAuthorized(res: Response, content?: any) {
  res.status(HttpStatusCodes.Unauthorized).json(content);
}

export function badRequest(res: Response, content?: any) {
  res.status(HttpStatusCodes.BadRequest).json(content);
}

export function serverError(res: Response, content?: any) {
  res.status(HttpStatusCodes.InternalServerError).json(content);
}

export function notFound(res: Response) {
  res.status(HttpStatusCodes.NotFound).json({
    errorMessage: "Resource does not exist",
  });
}

export function methodNotAllowed(res: Response, message: string) {
  res.status(HttpStatusCodes.MethodNotAllowed).json({
    message: message,
  });
}
