import { describe, it } from "node:test";
import assert from 'node:assert/strict';
import { Calculator } from "../src/base.js";

describe('Calculator', () => {
  describe('addition()', () => {
    it('should add numbers properly', () => {
      
      // Arrange
      const calculator = new Calculator();
      
      // Act
      const result = calculator.addition(1, 2);

      // Assert
      assert.equal(result, 4);
    })
  })
})

/* Les Assertions classiques
  assert.equal(result, expected) => Egalité sur les valeurs primitives ou les références mémoires 
  assert.notEqual(result, expected) => Inégalité sur les valeurs primitives ou les références mémoires
  assert.deepEqual(objA, objB) => Egalité sur les propriétés et leurs valeurs de deux objets complexes
  assert.notDeepEqual(objA, objB) => Inégalité sur les propriétés et leurs valeurs de deux objets complexes
  assert.deepStrictEqual(objA, objB) => Egalité sur les propriétés et leurs valeurs de deux objets complexes, à tout niveau hiérarchique
  assert.notStrictDeepEqual(objA, objB) => Inégalité sur les propriétés et leurs valeurs de deux objets complexes, à tout niveau hiérarchique

  assert.ok(condition) => Vérifier que le booléen est true 
  assert.not0k(condition) => Vérifier que le booléen est false 

  assert.throws(function) => Vérifie qu'une exception est levée
  assert.throws(function, TypeError) => Vérifie qu'une exception particulière est levée
  assert.throws(function, 'message') => Vérifie que le message de l'erreur correspond 
  assert.doesNotThrow(function) => N'a pas levé d'exception

  await assert.rejects(async function) => Vérifie qu'une erreur a eu lieu durant le mécanisme asynchrone
  await assert.rejects(async function, 'message') => Vérifie qu'une erreur a eu lieu durant le mécanisme asynchrone avec un certain message
  await assert.doesNotReject(async function, 'message') => Vérifie qu'une erreur n'a pas eu lieu durant le mécanisme asynchrone

  assert.fail('message') => Déclenche manuellement le fait que le test échoue
*/

