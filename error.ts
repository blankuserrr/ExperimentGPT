import { NextFunction, Request, Response } from "express";

export abstract class CustomError extends Error {
	constructor(public message: string, public statusCode: number, public name: string) {
		super(message);
	}
}

export class BadRequestError extends CustomError {
	constructor(message = "Bad Request") {
		super(message, 400, "BadRequestError");
		console.error(`[${new Date().toISOString()}] BadRequestError: ${message}`);
	}
}

export class UnauthorizedError extends CustomError {
	constructor(message = "Unauthorized") {
		super(message, 401, "UnauthorizedError");
		console.error(`[${new Date().toISOString()}] UnauthorizedError: ${message}`);
	}
}

export class InternalServerError extends CustomError {
	constructor(message = "Internal Server Error") {
		super(message, 500, "InternalServerError");
		console.error(`[${new Date().toISOString()}] InternalServerError: ${message}`);
	}
}

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
	console.error(`[${new Date().toISOString()}] Error: ${err.message} Stack: ${err.stack}`); // Log error stack trace

	if (err instanceof CustomError) {
		res.status(err.statusCode).send({ error: err.message });
	} else {
		res.status(500).send({ error: "Unknown Error" });
	}
}
