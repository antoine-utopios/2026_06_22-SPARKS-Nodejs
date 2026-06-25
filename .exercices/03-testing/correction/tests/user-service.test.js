import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import sinon from "sinon";
import { UserService } from "../src/user-service.js";

describe("UserService.getEnrichedUser", () => {
  let userRepository;
  let geoApi;
  let service;

  beforeEach(() => {
    // Stubs neufs + service neuf avant chaque test : coeur de l'isolation.
    userRepository = { findById: sinon.stub() };
    geoApi = { locate: sinon.stub() };
    service = new UserService(userRepository, geoApi);
  });

  afterEach(() => {
    sinon.restore();
  });

  // Partie 1 — cas nominal
  it("renvoie l'utilisateur enrichi du pays", async () => {
    userRepository.findById.resolves({ id: 1, name: "Ada", ip: "8.8.8.8" });
    geoApi.locate.resolves({ country: "US" });

    const result = await service.getEnrichedUser(1);

    assert.deepEqual(result, { id: 1, name: "Ada", ip: "8.8.8.8", country: "US" });
  });

  // Partie 2 — interactions
  it("appelle findById(1) une fois et locate avec l'IP", async () => {
    userRepository.findById.resolves({ id: 1, name: "Ada", ip: "8.8.8.8" });
    geoApi.locate.resolves({ country: "US" });

    await service.getEnrichedUser(1);

    assert.ok(userRepository.findById.calledOnceWithExactly(1));
    assert.ok(geoApi.locate.calledOnceWithExactly("8.8.8.8"));
  });

  // Partie 3 — cas d'erreur + isolation
  it("rejette si l'utilisateur est introuvable et n'appelle pas geoApi", async () => {
    userRepository.findById.resolves(null);

    await assert.rejects(() => service.getEnrichedUser(99), /USER_NOT_FOUND/);

    assert.equal(geoApi.locate.callCount, 0);
  });

  // Variante — mock sinon avec attentes a priori.
  // On part d'un geoApi neuf (méthode non stubbée) pour que sinon.mock puisse
  // wrapper `locate` : un mock ne peut pas envelopper un stub déjà posé.
  it("notifie via un mock vérifié", async () => {
    userRepository.findById.resolves({ id: 1, name: "Ada", ip: "8.8.8.8" });
    const cleanGeoApi = { locate() {} };
    const mock = sinon.mock(cleanGeoApi);
    mock.expects("locate").once().withArgs("8.8.8.8").resolves({ country: "US" });
    const mockService = new UserService(userRepository, cleanGeoApi);

    await mockService.getEnrichedUser(1);

    mock.verify();
  });

  // Bonus — cache : findById appelé une seule fois sur deux appels du même id
  it("met en cache : findById appelé une seule fois", async () => {
    userRepository.findById.resolves({ id: 1, name: "Ada", ip: "8.8.8.8" });
    geoApi.locate.resolves({ country: "US" });

    await service.getEnrichedUser(1);
    await service.getEnrichedUser(1);

    assert.equal(userRepository.findById.callCount, 1);
    assert.equal(geoApi.locate.callCount, 1);
  });
});
