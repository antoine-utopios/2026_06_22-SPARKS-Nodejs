import { describe, it, beforeEach } from 'node:test';
import request from 'supertest';
import sinon from 'sinon';
import assert from 'node:assert/strict';

import { createApp } from "../src/api.js";
import { DiceRoller } from '../src/randomDice.js';

describe('API', () => {
  let api;

  // Arrange commun
  beforeEach(() => {
    api = createApp();
  })

  it('should create properly', () => {
    assert.ok(api);
  })
  
  describe('/', () => {
    it('should respond with the basic hello world', async () => {
      
      // Act
      const response = await request(api).get('/')

      // Asserts
      assert.equal(response.status, 200);
      assert.equal(response.body.message, 'Hello World!')

      // // Act & Assert
      // request(api).get('/')
      // .expect(200)
      // .res('Hello World!')
    })
  })
})

describe('API avec Spy', () => {
  let api;
  let diceRollerStub;
  let rollD20Spy;

  // Arrange commun
  beforeEach(() => {
    const diceRoller = new DiceRoller()

    rollD20Spy = sinon.spy(diceRoller, 'rollD20')

    api = createApp({ rollD20: diceRollerStub });
  })

  describe('/dice-roll', () => {
    it('should call rollD20() in the dependency', async () => {
      // Act
      const response = await request(api).get('/dice-roll')

      // Asserts
      assert.ok(rollD20Spy.calledOnce)

      // mock.verify()
    })
  })

})
describe('API avec Stub', () => {
  let api;
  let diceRollerStub;

  // Arrange commun
  beforeEach(() => {
    diceRollerStub = sinon.stub().returns(6);

    api = createApp({ rollD20: diceRollerStub });
  })

  describe('/dice-roll', () => {
    it('should respond the correct message with the correct value', async () => {
      // Act
      const response = await request(api).get('/dice-roll')

      // Asserts
      assert.equal(response.status, 200);
      assert.equal(response.body.message, 'Le dé à donné comme valeur 6')
      assert.equal(response.bod.value, 6)

      assert.ok(diceRollerStub.called)
    })
  })

})

describe('API avec Mock', () => {
  let api;
  let mock;

  // Arrange commun
  beforeEach(() => {
    const diceRoller = new DiceRoller()

    mock = sinon.mock(diceRoller);
    mock.expects('rollD20').once();

    api = createApp(mock);
  })

  describe('/dice-roll', () => {
    it('should respond the correct message with the correct value', async () => {
      // Act
      const response = await request(api).get('/dice-roll')

      // Asserts
      assert.equal(response.status, 200);
      assert.equal(response.body.message, 'Le dé à donné comme valeur 6')
      assert.equal(response.bod.value, 6)

      mock.verify()

    })
  })

})

/* Lancer des requêtes

  request(api).get(route) => Permet de faire une requête GET vers une route particulière
  request(api).post(route) => Permet de faire une requête POST vers une route particulière
  request(api).post(route).send(body) => Permet de faire une requête POST vers une route particulière avec un corps particulier
  request(api).get(route).set(headerName, headerValue) => Permet de faire une requête GET vers une route particulière avec un header spécifique
  request(api).get(route).query({ paramA: value, paramB: value }) => Permet de faire une requête GET vers une route avec des query parameters (ici /route?paramA=value&paramB=value)
  request(api).post(route).attach('filename', '/path/to/file') => Permet de faire une requête POST en envoyant un fichier (multi-part)
  request(api).post(route).field('fieldName', 'value') => Permet de faire une requête POST en envoyant un formulaire (multi-part)
  

  Inspecter la réponse:

  response.status => Code de statut
  response.body => Corps de la réponse
  response.text => Texte brut de la réponse
  response.headers => Ensemble des headers de la réponse
  response.headers['name'] => Header spécifique dans la réponse

  Inspecter le Spy / Stub

  stub.called => On vérifie que le Stub a été appellé
  stub.notCalled => On vérifie que le Stub n'a pas été appellé
  stub.calledOnce => On vérifie que le Stub a été appellé une seule fois
  stub.callCount => On vérifie que le Stub a été appellé X fois
  stub.calledWith(arg) => On vérifie que le Stub a été appellé avec tel argument
  stub.calledOnceWith(arg) => On vérifie que le Stub a été appellé une seule fois avec tel argument
  stud.returnValues => On vérifie que le retour du stub est une certaine valeur
  stud.threw => On vérifie que le stub a levé une erreur lors de son execution

  */