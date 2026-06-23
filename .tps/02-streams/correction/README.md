# TP 2 - Endpoint Express de traitement streaming

`POST /process` recoit un corps de requete en **streaming** (sans body-parser),
le transforme via `Anonymizer` (e-mails -> `***@***`, majuscules, ligne par
ligne), et diffuse le resultat **a la fois** vers la reponse HTTP et vers un
fichier sur disque.

## Architecture

```
req (Readable) -> Anonymizer (Transform) -> tee (PassThrough) --pipe--> res (HTTP)
                                                              \--pipe--> fileStream (disque)
```

- Double diffusion via `tee.pipe(res)` + `tee.pipe(fileStream)` : un PassThrough
  envoie chaque chunk a tous ses consommateurs `pipe`. On ne fait PAS deux
  `pipeline(tee, ...)` (ils se disputeraient les chunks).
- `pipeline(req, new Anonymizer(), tee)` pilote l'amont et gere la backpressure.
- `finished(fileStream)` garantit que l'ecriture disque est complete.
- En cas d'erreur : `tee.unpipe(fileStream)`, `fileStream.destroy()`, `unlink`
  du fichier partiel, reponse 500 ou `res.destroy(err)` selon `headersSent`.
  Aucune fuite de descripteur, le serveur ne plante pas.

## Lancer

```bash
npm install
npm start
# autre terminal :
printf 'jean dupont <jean@acme.fr>\nmarie curie <marie@lab.org>\n' > people.txt
curl --data-binary @people.txt http://localhost:3000/process
```

## Tester

```bash
npm test
```

Les tests demarrent le serveur sur un port ephemere (port 0), POSTent un petit
flux via `fetch`, et verifient : la reponse transformee, l'egalite reponse/fichier,
l'absence de troncature de lignes sur un corps multi-chunks (5000 lignes), et la
disponibilite du serveur sur plusieurs requetes successives.
