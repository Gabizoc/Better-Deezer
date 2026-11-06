# HANDOFF — Better Deezer

> Fichier de passation entre sessions Claude Code. **Lis-le en entier avant de toucher au code, mets-le à jour avant chaque commit.**
> Langue du projet avec l'utilisateur : français. Code, commentaires et commits : anglais.

## 1. Le projet en une phrase

Une surcouche (CSS + JS) qui redessine Deezer — style « rework de Steam par Benjamin Code » — distribuée **en extension navigateur** et **pour l'app desktop Windows**, open source (MIT), qui doit **survivre aux mises à jour de Deezer** et être **installable par n'importe qui en un clic**.

## 2. Liens

- Maquettes / design system : canvas Claude Design privé du propriétaire (lien non publié).
  - `Main` = design system « Graphite » (tokens, typo, icônes, composants)
  - `Home`, `Album`, `Artist`, `Search` = écrans cibles
  - D'autres artboards arrivent : thème clair, volume, modales, notifications, profil, réglages Better Deezer, recommandations.
- Extension d'origine de l'utilisateur (« Deezer Tweaks » v0.1.62) : portée dans `src/features/volume.js`, `search.js`, `tooltips.js`. Ses idées validées par l'utilisateur : rail flottant arrondi, player flottant, recherche centrée pill avec bouton Accueil à gauche, volume inline + molette, tooltips.

## 3. Décisions de design (validées ou demandées par l'utilisateur)

- **Pas d'« AI slop »** : pas de dégradé bleu-violet, pas de Lucide/shadcn par défaut, pas d'emoji. Icônes maison (grille 24, trait 1.75, arrondies) — voir artboard `Main`.
- Fond graphite chaud `#0B0A0C`, surfaces `#141316 / #1C1A1F / #26232A`, un **seul accent** `#A238FF` (violet Deezer) en aplat.
- Polices : Bricolage Grotesque (titres) + Instrument Sans (UI). Toutes deux SIL OFL → à **vendoriser** en woff2 (CSP).
- **Barre de lecture** : l'utilisateur aime SA version (capture : dock flottant arrondi, bouton lecture rond violet, cœur violet plein, `+`, temps de part et d'autre d'une barre fine à remplissage violet, icônes à droite : paroles, file, volume, réglages audio). **La garder**, juste l'aligner sur les tokens.
- **Volume** : clic sur l'icône → un slider se déplie vers la gauche dans une pill (`surface-2`), l'icône reste à droite avec un anneau accent ; **molette** sur l'icône ou le slider pour régler. (Captures de l'utilisateur.)
- **Rail (sidebar)** : flottant, **centré verticalement ET horizontalement** quand replié (comme sa v0.1.62 : `top:50%; translateY(-50%); height:fit-content`), hovers visibles.
- **Recherche** : pill large centrée, bordure accent au focus, popover arrondi `r=22` aligné sous le champ, entrées « Dernières recherches » avec cœur. Raccourci `Ctrl K`.
- **Thèmes clair ET sombre** demandés. Tout passe par des tokens `--bd-*` ; le thème clair redéfinit seulement les tokens sous `html[data-bd-theme="light"]`.
- **Modales, notifications, menu profil, popovers** : tous à personnaliser.
- Pages : l'utilisateur veut qu'on **réorganise** (ajouter/supprimer des sections inutiles) et des idées pour **améliorer les recommandations** (voir §8).

## 4. Architecture

```
src/
  styles/00-tokens.css   tokens (seule source de couleurs/rayons/durées)
  styles/10-base.css     fonts, fond, scrollbars, focus, view transitions
  styles/20-shell.css    rail, topbar, dock
  styles/30-content.css  cartes, lignes de pistes, en-têtes
  styles/40-overlays.css popovers, menus, tooltips, volume, badge
  core/00-core.js        objet BD partagé, settings (localStorage bd:*), helpers
  core/10-anchors.js     LE SEUL endroit qui sait trouver les éléments Deezer
  features/*.js          une feature = { id, setup(), update() }
  main.js                boot, MutationObserver (1 frame max), isolation des erreurs, API console
scripts/build.mjs        build sans dépendance -> dist/extension + dist/better-deezer.user.js
extension/manifest.json  MV3
```

### Règle d'or anti-casse (mises à jour Deezer)

1. Le CSS ne cible **jamais** les classes générées `css-xxxx` (elles changent à chaque release). Il cible uniquement `[data-bd="…"]` / `[data-bd-role="…"]`, posés par JS.
2. Le JS trouve les éléments via `data-testid`, ids (`#page_topbar`, `#page_content`), rôles ARIA, puis heuristiques géométriques — tout ça **uniquement dans `core/10-anchors.js`**.
3. Si une ancre ne résout pas, la feature ne tague rien → Deezer reste dans son état natif (dégradation propre, jamais d'UI cassée).
4. Une feature qui jette une exception est désactivée pour la session, les autres continuent.
5. `__betterDeezer.health()` dans la console liste les ancres OK/KO. Après une mise à jour Deezer : lancer ça, corriger `anchors`, c'est tout.
6. Kill switch : `__betterDeezer.disable()` (tout) ou `__betterDeezer.disable("volume")` (une feature).

## 5. App desktop Deezer — ce qu'on sait (étudié sur 8.0.10, 2026-11-06)

- Installeur : `https://www.deezer.com/desktop/download?platform=win32&architecture=x86` → NSIS → `$PLUGINSDIR/app-32.7z` → `resources/app.asar` (3,4 Mo seulement).
- **Electron 38.4.0**. `build/main.js` fait `loadURL("https://www.deezer.com/…")` : **l'UI desktop EST le site web**. Même DOM, mêmes `data-testid` → une seule base de code pour l'extension et le desktop.
- Fuses Electron : RunAsNode=on, NodeOptions=on, NodeCliInspect=on, **EmbeddedAsarIntegrityValidation=off**, **OnlyLoadAppFromAsar=off**.
- Variables d'env reconnues : `DZ_DEVTOOLS=yes` (active les DevTools), `DZ_DISABLE_UPDATE=yes`, `DZ_LANG`, `DZ_DEV_ENV`.
- Install par défaut : `%LOCALAPPDATA%\Programs\deezer-desktop\Deezer.exe` (à confirmer sur une machine Windows ; prévoir aussi `Program Files`).

### Stratégie d'injection desktop retenue

**Lanceur + Chrome DevTools Protocol** (aucun fichier Deezer modifié → survit aux mises à jour automatiques) :
1. Lancer `Deezer.exe --remote-debugging-port=<port aléatoire> --remote-allow-origins=http://127.0.0.1:<port>` (switch Chromium, non bloqué par les fuses).
2. `GET http://127.0.0.1:<port>/json` → cibles `page` dont l'URL contient `deezer.com`.
3. WebSocket CDP : `Page.addScriptToEvaluateOnNewDocument` + `Runtime.evaluate` avec `dist/better-deezer.user.js`.
4. Écrire le lanceur en **PowerShell pur** (`System.Net.WebSockets.ClientWebSocket`, dispo sur Windows 10/11) → zéro dépendance, pas de Node chez l'utilisateur.
5. Raccourci « Better Deezer » (menu Démarrer + bureau) → `powershell -WindowStyle Hidden -File launcher.ps1`.
- Sécurité : le port de debug n'écoute que sur 127.0.0.1 ; port aléatoire ; le documenter dans le README.
- Plan B si un jour le switch est bloqué : patch `app.asar` (possible tant que l'intégrité asar est off), à ré-appliquer après chaque mise à jour.

## 6. Installation « pour tout le monde » (objectif)

- **Windows desktop** : une ligne PowerShell `irm https://github.com/Gabizoc/Better-Deezer/releases/latest/download/install.ps1 | iex` qui télécharge la release, installe dans `%LOCALAPPDATA%\BetterDeezer`, crée les raccourcis. Désinstalleur inclus.
- **Navigateur** : zip de l'extension dans les Releases (chargement non empaqueté), puis publication Chrome Web Store / Edge Add-ons / Firefox AMO.
- **Userscript** : `better-deezer.user.js` pour Violentmonkey/Tampermonkey.
- CI GitHub Actions : sur tag `v*`, `npm run build`, zip, attacher `install.ps1`, `launcher.ps1`, `better-deezer.user.js`, `better-deezer-extension.zip`.

## 7. État actuel

Fait :
- Design system + 4 écrans (canvas ci-dessus), avec vraies pochettes (API Deezer).
- Squelette code : tokens, shell/content/overlays CSS, ancres, features `fonts`, `shell`, `content`, `now-playing`, `ambient`, `search`, `volume`, `tooltips`, boot robuste, build.

**Rien n'a encore été testé sur le vrai Deezer** (pas de compte ni de Windows dans le conteneur cloud). Priorité à la vérification réelle par l'utilisateur.

## 8. Backlog (par priorité)

1. Thème clair/sombre : tokens light + toggle (réglages + suit `prefers-color-scheme` par défaut).
2. Volume façon captures (clic = déplie, molette, anneau accent) — adapter `features/volume.js` + CSS.
3. Rail centré vertical/horizontal + hovers (port propre de la v0.1.62, sans classes `css-xxxx`).
4. Player bar = style de l'utilisateur (accent violet sur lecture / cœur / progression).
5. Modales (`[role=dialog]`, `.chakra-modal__content`), menus, notifications, menu profil, popover recherche.
6. Panneau **Réglages Better Deezer** (thème, densité, features on/off, raccourcis) ouvert depuis le menu profil.
7. Lanceur desktop PowerShell + `install.ps1` + désinstalleur + CI release.
8. Vendoriser les polices (woff2) au lieu de Google Fonts.
9. Pages : réorganiser l'accueil (masquer les carrousels redondants, épingler « Reprendre l'écoute »), en-têtes album/artiste teintés.
10. Recommandations — idées à prototyper côté client, sans toucher au serveur :
    - « Pourquoi ce titre ? » (artiste similaire / écouté N fois / genre) à partir des données déjà présentes dans la page.
    - Curseur **Familier ↔ Découverte** pour Flow et les mixes (filtrer/réordonner : déjà liké vs jamais écouté).
    - **Exclure un artiste / un genre** partout (liste noire locale appliquée aux carrousels et au Flow).
    - Contexte horaire (matin calme, soir énergique) comme ordre par défaut des sections.
    - « Ne plus recommander » persistant, appliqué au DOM avant affichage.

## 9. Conventions

- Branche de travail : `claude/modest-davinci-kgm2qs`. Pas de PR sans demande explicite.
- Messages de commit en anglais, impératif.
- Toute nouvelle ancre → `core/10-anchors.js` + entrée dans `health`.
- Toute nouvelle couleur → token d'abord.
- Garder `npm run build` sans dépendance.

## 10. Journal

- 2026-11-06 — Session 1 : design system « Graphite » + écrans ; étude de Deezer desktop 8.0.10 ; squelette surcouche ; ce fichier.
