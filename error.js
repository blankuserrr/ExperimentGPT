"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.InternalServerError = exports.UnauthorizedError = exports.BadRequestError = void 0;
class BadRequestError extends Error {
    constructor(message = 'Bad Request') {
        super(message);
        this.name = 'BadRequestError';
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}
exports.UnauthorizedError = UnauthorizedError;
class InternalServerError extends Error {
    constructor(message = 'Internal Server Error') {
        super(message);
        this.name = 'InternalServerError';
    }
}
exports.InternalServerError = InternalServerError;
function errorHandler(err, req, res, next) {
    console.error(err.stack); // Log error stack trace
    if (err instanceof BadRequestError) {
        res.status(400).send({ error: err.message });
    }
    else if (err instanceof UnauthorizedError) {
        res.status(401).send({ error: err.message });
    }
    else if (err instanceof InternalServerError) {
        res.status(500).send({ error: err.message });
    }
    else {
        res.status(500).send({ error: 'Unknown Error' });
    }
}
exports.errorHandler = errorHandler;
