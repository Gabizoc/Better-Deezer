# Polices incluses

Les deux familles sont sous licence SIL Open Font License 1.1 (voir les fichiers `OFL-*.txt`), qui permet de les distribuer avec Better Deezer.

| Famille | Fichiers | Source |
| --- | --- | --- |
| Space Grotesk (variable, graisse 300–700), titres | `space-grotesk-latin[-ext]-wght-normal.woff2` | npm `@fontsource-variable/space-grotesk@5.3.0` |
| Inter (variable, graisse 100–900), interface | `inter-latin[-ext]-wght-normal.woff2` | npm `@fontsource-variable/inter@5.3.0` |

`fonts.json` les liste avec leurs plages Unicode. `scripts/build.mjs` les copie dans l'extension (ressources accessibles depuis le web) et les intègre en base64 dans le fichier unique (application Windows, userscript). `src/features/fonts.js` les enregistre avec l'API FontFace : aucune requête réseau, aucun souci de CSP `font-src`.
