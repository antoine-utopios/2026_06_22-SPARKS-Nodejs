import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AppError,
  NotFoundError,
  ValidationError,
  ConflictError,
} from "../src/errors.js";

test("AppError porte statusCode/isOperational et une stack propre", () => {
  const e = new AppError("boom", 418, true);
  assert.ok(e instanceof Error);
  assert.equal(e.statusCode, 418);
  assert.equal(e.isOperational, true);
  assert.equal(e.name, "AppError");
  assert.ok(typeof e.stack === "string" && e.stack.length > 0);
});

test("NotFoundError -> 404 et name = NotFoundError", () => {
  const e = new NotFoundError("Article 7 introuvable");
  assert.equal(e.statusCode, 404);
  assert.equal(e.isOperational, true);
  assert.equal(e.name, "NotFoundError");
  assert.match(e.message, /Article 7 introuvable/);
});

test("ValidationError -> 400", () => {
  assert.equal(new ValidationError().statusCode, 400);
  assert.equal(new ValidationError().name, "ValidationError");
});

test("ConflictError -> 409", () => {
  assert.equal(new ConflictError().statusCode, 409);
  assert.equal(new ConflictError().name, "ConflictError");
});
