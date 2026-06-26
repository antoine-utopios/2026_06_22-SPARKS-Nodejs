// Partie 1 - Hierarchie de classes d'erreurs.

export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name; // reflete la sous-classe dans les logs
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor); // stack pointee sur l'appelant
  }
}

export class NotFoundError extends AppError {
  constructor(msg = "Ressource introuvable") {
    super(msg, 404);
  }
}

export class ValidationError extends AppError {
  constructor(msg = "Donnees invalides") {
    super(msg, 400);
  }
}

export class ConflictError extends AppError {
  constructor(msg = "Conflit") {
    super(msg, 409);
  }
}
