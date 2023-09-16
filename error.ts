import { NextFunction, Request, Response } from "express";

export class BadRequestError extends Error {
	constructor(message = "Bad Request") {
		super(message);
		this.name = "BadRequestError";
	}
}

export class UnauthorizedError extends Error {
	constructor(message = "Unauthorized") {
		super(message);
		this.name = "UnauthorizedError";
	}
}

export class InternalServerError extends Error {
	constructor(message = "Internal Server Error") {
		super(message);
		this.name = "InternalServerError";
	}
}

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
	console.error(err.stack); // Log error stack trace

	if (err instanceof BadRequestError) {
		res.status(400).send({ error: err.message });
	} else if (err instanceof UnauthorizedError) {
		res.status(401).send({ error: err.message });
	} else if (err instanceof InternalServerError) {
		res.status(500).send({ error: err.message });
	} else {
		res.status(500).send({ error: "Unknown Error" });
	}
}
