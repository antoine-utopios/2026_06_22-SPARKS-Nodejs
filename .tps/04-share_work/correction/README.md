# Solution — TP 4 : Profiler, corriger une fuite memoire et scaler en cluster

API catalogue produits : fuite memoire corrigee (cache LRU borne) et endpoint
CPU-bound scale en cluster.

## Fichiers

- `src/app-leaky.js` — version FUYANTE fournie (cache global non borne, cle
  unique par requete). Sert a reproduire et profiler la fuite.
- `src/app.js` — version CORRIGEE : cache LRU borne (`max: 500`, `ttl`) + cle
  stable. Ajoute `/remise/:montant` (CPU-bound) et `/mem`.
- `src/remise.js` — calcul CPU-bound isole (testable).
- `src/cluster.js` — primaire qui forke N workers et relance un worker mort.

## Lancer / mesurer

```bash
npm install
# Profiler la fuite (etape 1) :
node --expose-gc --inspect src/app-leaky.js
autocannon -c 50 -d 20 "http://localhost:3000/produit/42"   # entrees grimpent sans fin

# Version corrigee (etape 2) :
node --expose-gc src/app.js
curl http://localhost:3000/mem    # entrees plafonne a 500, heapUsed stable

# Scaler le CPU-bound (etape 3) :
node src/app.js      && autocannon -c 100 -d 20 "http://localhost:3000/remise/1000"  # mono
node src/cluster.js  && autocannon -c 100 -d 20 "http://localhost:3000/remise/1000"  # cluster
```

En cluster, les reponses /remise affichent plusieurs `pid` et le debit augmente
avec le nombre de coeurs.

## Tests

```bash
npm test
```

- `tests/memory.test.js` — la version fuyante croit sans borne ; la version
  corrigee plafonne a `MAX_ENTREES` (LRU) ; cle stable => une seule entree.
- `tests/remise.test.js` — determinisme du calcul + route renvoie signature+pid.
- `tests/cluster.test.js` — le primaire forke 2 workers, repartit les requetes
  (plusieurs pid), et relance un worker tue (resilience).

> Qualitatif : on teste des PROPRIETES (bornage du cache, pid multiples,
> relance), pas des octets exacts ni des req/s, qui dependent du materiel.
> `/mem` utilise `global.gc()` si dispo (`--expose-gc`) mais les tests ne
> dependent PAS de gc — ils mesurent `cache.size`.
