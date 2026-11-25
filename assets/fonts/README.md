# Polices incluses

Les familles sont sous licence SIL Open Font License 1.1 (voir les fichiers `OFL-*.txt`), qui permet de les distribuer avec Better Deezer.

| Famille | Fichiers | Source |
| --- | --- | --- |
| Space Grotesk (variable, graisse 300–700) | `space-grotesk-latin[-ext]-wght-normal.woff2` | npm `@fontsource-variable/space-grotesk@5.3.0` |
| Inter (variable, graisse 100–900) | `inter-latin[-ext]-wght-normal.woff2` | npm `@fontsource-variable/inter@5.3.0` |
| Bricolage Grotesque (variable, graisse 200–800) | `bricolage-grotesque-latin[-ext]-wght-normal.woff2` | npm `@fontsource-variable/bricolage-grotesque@5.3.0` |
| Instrument Sans (variable, graisse 400–700) | `instrument-sans-latin[-ext]-wght-normal.woff2` | npm `@fontsource-variable/instrument-sans@5.3.0` |
| Manrope (variable, graisse 200–800) | `manrope-latin[-ext]-wght-normal.woff2` | npm `@fontsource-variable/manrope@5.3.0` |
| Sora (variable, graisse 100–800) | `sora-latin[-ext]-wght-normal.woff2` | npm `@fontsource-variable/sora@5.3.0` |
| DM Sans (variable, graisse 100–1000) | `dm-sans-latin[-ext]-wght-normal.woff2` | npm `@fontsource-variable/dm-sans@5.3.0` |
| Outfit (variable, graisse 100–900) | `outfit-latin[-ext]-wght-normal.woff2` | npm `@fontsource-variable/outfit@5.3.0` |
| Figtree (variable, graisse 300–900) | `figtree-latin[-ext]-wght-normal.woff2` | npm `@fontsource-variable/figtree@5.3.0` |
| Plus Jakarta Sans (variable, graisse 200–800) | `plus-jakarta-sans-latin[-ext]-wght-normal.woff2` | npm `@fontsource-variable/plus-jakarta-sans@5.3.0` |

`fonts.json` les liste avec leurs plages Unicode. `scripts/build.mjs` les copie dans l'extension (ressources accessibles depuis le web) et les intègre en base64 dans le fichier unique (application Windows, userscript). `src/features/fonts.js` définit les 6 paires proposées dans *Réglages › Apparence* et n'enregistre une famille, avec l'API FontFace, que lorsqu'elle sert : aucune requête réseau, aucun souci de CSP `font-src`.
