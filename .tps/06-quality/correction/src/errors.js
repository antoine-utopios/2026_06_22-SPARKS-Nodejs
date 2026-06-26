export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(msg = "Introuvable") {
    super(msg, 404);
  }
}

export class ValidationError extends AppError {
  constructor(msg = "Donnee invalide") {
    super(msg, 400);
  }
}
