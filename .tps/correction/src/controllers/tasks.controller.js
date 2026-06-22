import * as service from "../services/tasks.service.js";

export function lister(req, res) {
  res.json(service.lister());
}

export function creer(req, res) {
  const tache = service.creer(req.body);
  res.status(201).json(tache);
}

export function recupererParId(req, res) {
  res.json(service.recupererParId(req.params.id));
}
