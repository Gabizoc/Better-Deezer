# HANDOFF — Better Deezer

> Fichier de passation entre sessions Claude Code. **Lis-le en entier avant de toucher au code, mets-le à jour avant chaque commit.**
> Langue du projet avec l'utilisateur : français. Code, commentaires et commits : anglais.

## 1. Le projet en une phrase

Une surcouche (CSS + JS) qui redessine Deezer — style « rework de Steam par Benjamin Code » — distribuée **en extension navigateur** et **pour l'app desktop Windows**, open source (MIT), qui doit **survivre aux mises à jour de Deezer** et être **installable par n'importe qui en un clic**.

## 2. Liens

- Maquettes / design system : canvas Claude Design privé du propriétaire (lien non publié).
  - `Main` = design system « Graphite » (tokens, typo, icônes, composants)
  - `Home`, `Album`, `Artist`, `Search` = écrans cibles
  - `HomeLight` (thème clair), `Overlays` (volume, recherche, notifications, menu profil, modale, toast), `Settings` (réglages Better Deezer + recommandations). Ajoutés en session 2 par la session design (message reçu le 2026-11-06, intégré, voir §3).
- Extension d'origine de l'utilisateur (« Deezer Tweaks » v0.1.62) : idées reprises dans `features/volume.js`, `search.js`, `tooltips.js`, `shell.js`.

## 3. Décisions de design (validées ou demandées par l'utilisateur)

- **Pas d'« AI slop »** : pas de dégradé bleu-violet, pas de Lucide/shadcn par défaut, pas d'emoji. Icônes maison (grille 24, trait 1.75, arrondies).
- **Sombre** : fond graphite chaud `#0B0A0C`, surfaces `#141316 / #1C1A1F / #26232A`, un **seul accent** `#A238FF` en aplat.
- **Clair** (artboard HomeLight) : bg `#F5F3F0`, surface-1 `#FFFFFF`, surface-2 `#ECE9E5`, surface-3 `#E2DED9`, line `#DDD8D2`, line-strong `#CFC9C2`, text `#151317 / #4A4550 / #6B6570`, accent **`#8A1FE8`** (plus foncé pour le contraste), accent-text `#7A14D6`. Rail, dock et popovers en surface-1 blanc avec bordure line.
- Polices : Bricolage Grotesque (titres) + Instrument Sans (UI), SIL OFL, **vendorisées** (`assets/fonts`).
- **Barre de lecture** : la version de l'utilisateur (dock flottant arrondi, lecture rond violet, cœur violet plein, `+`, temps de part et d'autre d'une barre fine violette, icônes à droite).
- **Volume** (artboard Overlays) : survol = pastille surface-3 ; clic = slider 140 px qui se déplie à gauche dans une pill surface-2 de 48 px, anneau accent 2 px, voisins qui glissent en 320 ms ; **re-clic = muet** ; Échap ou clic ailleurs = replier ; pendant le réglage piste 6 px accent + bulle « 70 % » ; pas 5 %, Maj = 1 %, flèches.
- **Rail** : flottant, replié = centré verticalement (au-dessus du dock) **et** horizontalement, hovers visibles.
- **Recherche** : pill, bordure accent 2 px au focus, popover r=22 surface-1 aligné sous le champ, « Tout effacer », pied avec raccourcis. `Ctrl K`.
- **Notifications** : panneau r=22, filtres Sorties / Social, pastille accent pour le compteur. (« Tout marquer comme lu » : non fait, ce serait une action sur le compte.)
- **Menu profil** : sélecteur Clair / Sombre / Auto + entrée « Réglages Better Deezer (Ctrl ,) ».
- **Modale** : r=22, surface-1, primaire = couleur du texte (blanc en sombre), secondaire surface-2, fond `#050405` à 80 %. **Toast** : pill claire.
- **Réglages** : onglets Apparence, Lecture et volume, Accueil (sections on/off), Recommandations, Raccourcis, À propos.
- **Pages** (inspiration Apple Music / Spotify / Tidal) : en-tête teinté par la pochette, grand titre display, photo ronde pour artistes/profils, cœur et ⋯ au survol, popularité en barre fine, filtre « Masquer les titres explicites », salutation sur l'accueil.
- Petits plus demandés : molette sur la pochette du dock = ±5 s ; double-clic sur le titre du dock = album ; `Q` = file d'attente ; astuces dans les infobulles.

## 4. Architecture

```
src/
  styles/00-tokens.css   tokens sombre (:root) + clair (html[data-bd-theme=light]) — seule source de couleurs
  styles/05-tempo.css    pont vers le design system de Deezer (--tempo-* -> --bd-*), voir §5
  styles/10-base.css     fond, scrollbars, focus, view transitions
  styles/20-shell.css    rail, topbar, recherche, dock
  styles/30-content.css  cartes, lignes, en-têtes de pages, accueil, chips
  styles/40-overlays.css popovers, menus, notifications, modales, toasts, tooltips, volume
  styles/50-settings.css panneau Réglages Better Deezer (DOM à nous, classes .bd-*)
  core/00-core.js        objet BD, settings (localStorage bd:*), bus d'événements, BD.h (DOM), BD.t (fr/en)
  core/10-anchors.js     LE SEUL endroit qui sait trouver les éléments Deezer
  core/20-theme.js       thème dark/light/system (html[data-bd-theme])
  features/*.js          une feature = { id, label?, setup(), update() } ; label = toggle dans les réglages
  main.js                boot (attend le DOM si injecté tôt), MutationObserver (1 frame max), isolation des erreurs, API console
assets/fonts/            woff2 OFL + fonts.json (plages unicode)
desktop/                 install.ps1 (amorce ASCII) -> setup.ps1, launcher.ps1, uninstall.ps1
scripts/build.mjs        build sans dépendance -> dist/extension + dist/better-deezer.user.js (CSS + polices base64)
test/fixture.html        page qui reproduit les vraies ancres de Deezer
test/smoke.mjs           50 vérifications dans Chromium (npm test)
test/cdp-inject.mjs      rejoue la séquence CDP du lanceur contre Chromium sur le vrai deezer.com
.github/workflows/       ci.yml (build, smoke, parse PS 5.1, PSScriptAnalyzer) ; release.yml (tag v*)
```

### Règle d'or anti-casse (mises à jour Deezer)

1. Le CSS ne cible **jamais** les classes générées `css-xxxx`. Il cible `[data-bd="…"]` / `[data-bd-role="…"]` (posés par JS), des `data-testid` et des rôles ARIA. Le smoke test vérifie qu'aucun `.css-` n'est présent dans la feuille.
2. Le JS trouve les éléments via `data-testid`, ids, rôles ARIA, heuristiques géométriques — **uniquement dans `core/10-anchors.js`**. Les classes écrites à la main dans le source de Deezer (`.naboo`, `.slider-track`, `.chakra-*`) sont tolérées en dernier recours, dans les ancres seulement.
3. Ne **jamais déplacer** un nœud possédé par React (crash au prochain rendu). On ajoute des frères (`insertBefore`) ou des enfants à la fin ; l'ordre visuel se règle en CSS (`order`).
4. Si une ancre ne résout pas, la feature ne tague rien → Deezer reste natif.
5. Une feature qui jette une exception est désactivée pour la session.
6. `Réglages > À propos` et `__betterDeezer.health()` listent les ancres KO. Les ancres « optionnelles » (overlays fermés) valent `"not open"`.
7. Kill switch : Réglages > À propos > Désactiver, ou `__betterDeezer.disable()`. Pour réactiver : `Ctrl ,` puis OK.

## 5. Deezer — ce qu'on sait

### App desktop (étudiée sur 8.0.10, 2026-11-06)

- Installeur NSIS → `resources/app.asar`. **Electron 38.4.0**, `loadURL("https://www.deezer.com/…")` : **l'UI desktop EST le site web**.
- Fuses : RunAsNode=on, NodeOptions=on, NodeCliInspect=on, EmbeddedAsarIntegrityValidation=off, OnlyLoadAppFromAsar=off.
- Env : `DZ_DEVTOOLS=yes`, `DZ_DISABLE_UPDATE=yes`, `DZ_LANG`, `DZ_DEV_ENV`.
- Install par défaut supposée : `%LOCALAPPDATA%\Programs\deezer-desktop\Deezer.exe` (le lanceur cherche aussi `Programs\Deezer`, Program Files et les clés Uninstall du registre).

### Bundle du web player (app-web.f39f92e1 + 261 chunks, récupérés le 2026-11-06)

- Design system **Tempo** = Chakra UI avec `cssVarPrefix: "tempo"`. Jetons sémantiques `background|text|icon|border|divider . neutral|accent|feedback . primary|secondary|tertiary|inverse|onDark|onLight|onAccent . default|hovered|pressed|selected|disabled|focused` → variables `--tempo-colors-…`. Polices `--tempo-fonts-body|heading|headline`, rayons `--tempo-radii-2xs…l`. Mode sombre : `.chakra-ui-dark` + `html[data-theme=dark]`, et certains blocs portent leur propre `[data-theme]`. → `styles/05-tempo.css` les repointe vers `--bd-*` (avec `!important`, ça gagne sur toute spécificité) : **c'est ce qui thème 90 % de l'app**.
- Layout : `.naboo` porte `--layout-sidebar-width` (**80px replié / 243px déplié**, clé localStorage `sidebar-collapsed`), `--layout-player-height: 80px`, `--layout-topbar-height: 80px`. Le rail Deezer est `position: fixed; top 0; bottom 0; width: var(--layout-sidebar-width)`.
- Ids : `#page_topbar`, `#page_content`, `#page_player` (+ `data-testid="miniplayer_container"`, barre fixe interne z-index 300).
- Player : `play_button_play|pause|stop`, `previous_track_button`, `next_track_button`, `shuffle_play_button_on|off`, `repeat_button_off|all|single`, `add_to_favorite_button_on|off`, `add_to_playlist_button`, `item_cover|item_title|item_subtitle`, `elapsed_time`, `remaining_time`, `progress_bar` (= `input.slider-track-input[type=range]`, piste dessinée par `.slider-track-default` / `.slider-track-active` ; **seek au `mouseup`**), `lyrics_button`, `queue_list_button`, `audio_settings_button`, `volume_button_default|mute` (clic = muet natif), `volume_menu` (popover hover, rendu en ligne, `role=tooltip`) + `volume_menu_bar` (range 0–100, `onChange` → `setVolume`).
- Topbar : `search_container`, `search_field`, `search_popper` (`.popper-search`), `recent_search_title`, `recent_search_clear_button`, `topbar-profile`, `account-popover-content` (ul `role=navigation`, li `data-testid` = multiAccount, account, subscription, recommendations, getGiftCard, logout, display, support…), cloche = icône `BellOutlinedIcon` (popover `data-testid="popover-content"`), compteur `aria-label="topbar-notification-counter"`.
- Rail : bouton `aria-label="Masquer|Afficher la barre latérale"` avec icône `PanelLeftIcon|PanelRightIcon`, `sidebar-profile`.
- **Les icônes Tempo portent leur nom en `data-testid`** sur le site réel (`HouseOutlinedIcon`, `HeartFilledIcon`, `PlusIcon`, `MoreHorizontalIcon`, `ExplicitIcon`…) : très bonnes ancres.
- Pages : `masthead`, `album-cover`, `artist-cover`, `user-cover`, `masthead-subtitle`, `creator-name`, `toolbar`, grille `role=grid` (lignes `role=row` `aria-rowindex`), `title`, `duration`, `popularity` (`aria-label="Popularité : 8 / 10"`, `note-active|inactive`), `select_button`, `section_title`, `section_title_cta`, `section-renderer`.
- Overlays : `modal_header`, `modal_body`, `modal_close_button`, `btn-modal-confirm|cancel`, `context-menu-content`, toasts Chakra (`#chakra-toast-manager-*`, `.chakra-toast__inner role=status`).
- Raccourcis natifs (lib `mousetrap`) : Espace, Maj+Entrée, `s`, ←/→ (± avance), Maj+←/→ (titre), `r`, Maj+R, `m`, Maj+↑/↓ (volume), `l` (coup de cœur), `0…9`, `h`/`?` (panneau).
- CSP : **report-only** (rien n'est bloqué aujourd'hui). Le CDN des pochettes (`cdn-images.dzcdn.net`) répond CORS pour `https://www.deezer.com`.

### Stratégie d'injection desktop (implémentée)

`desktop/launcher.ps1`, PowerShell pur : ferme Deezer s'il tourne (verrou d'instance unique), le relance avec `--remote-debugging-port=<port libre> --remote-allow-origins=http://127.0.0.1:<port>`, interroge `/json/list` toutes les 2 s, et pour chaque page deezer.com : WebSocket CDP → **`Page.enable`** (obligatoire : sans lui, `addScriptToEvaluateOnNewDocument` est accepté mais ne s'exécute pas au rechargement — vérifié par `test/cdp-inject.mjs`) → `Page.addScriptToEvaluateOnNewDocument` → `Runtime.evaluate` si `window.__betterDeezer` absent. Les sockets restent ouverts tant que Deezer tourne (sinon les scripts sont retirés). Garde-fou dans `main.js` : top frame + hôte `*.deezer.com` uniquement, attente du DOM si injecté tôt.
Plan B si le switch est bloqué un jour : patch de `app.asar` (possible tant que l'intégrité asar est off).

## 6. Installation « pour tout le monde »

- **Windows** : `irm https://github.com/Gabizoc/Better-Deezer/releases/latest/download/install.ps1 | iex`. `install.ps1` est **100 % ASCII** (vérifié en CI) car `irm | iex` peut mal décoder ; il télécharge les fichiers dans `%TEMP%\BetterDeezer-setup` et lance `setup.ps1` (UTF-8 **avec BOM**, sinon PowerShell 5.1 lit en ANSI) qui installe dans `%LOCALAPPDATA%\BetterDeezer`, crée les raccourcis (icône de Deezer) et une entrée *Paramètres > Applications* (HKCU, sans admin). `uninstall.ps1` arrête le lanceur et nettoie tout.
- **Navigateur** : zip de l'extension dans les Releases. Publication Chrome Web Store / Edge / Firefox AMO : à faire.
- **Userscript** : `better-deezer.user.js`.
- **Release** : pousser un tag `vX.Y.Z` égal à `package.json` → `release.yml` publie extension zip, Windows zip, scripts, payload et `SHA256SUMS.txt`.

## 7. État actuel (fin de session 2, 2026-11-07)

Fait et poussé (backlog §8 points 1 à 9 de la session 1) :
1. Thèmes clair / sombre / auto + pont Tempo.
2. Volume façon captures + artboard Overlays.
3. Rail replié centré (vertical + horizontal), hovers, page active, en-têtes collants opaques.
4. Barre de lecture de l'utilisateur, molette sur la progression et la pochette.
5. Modales, menus, notifications (filtres), menu profil (thème + réglages), popover de recherche, toasts, interrupteurs.
6. Panneau Réglages Better Deezer (6 onglets), `Ctrl ,`, `Q`, liste « Ne plus me recommander ».
7. Lanceur desktop, installeur, désinstalleur, CI + release.
8. Polices vendorisées.
9. Premier rework des pages (album, artiste, profil, playlist, accueil).

Vérifié :
- `npm run build`, `node --check` des deux sorties, **smoke test 50/50** (fixture), CI GitHub verte (Linux + Windows : parse PowerShell 5.1 + PSScriptAnalyzer sans erreur).
- **Extension chargée dans Chromium sur le vrai deezer.com**, hors connexion (album, artiste) puis **connecté au compte de l'utilisateur** (accueil, album, artiste, profil, playlist, Explorer, recherche, menu profil, notifications, modale, réglages, rail replié/déplié, thèmes clair et sombre). Plusieurs passes de design, problèmes trouvés corrigés (voir journal).
- Séquence CDP du lanceur rejouée contre Chromium sur deezer.com (`test/cdp-inject.mjs`) : injection + survie au rechargement.

**Non testé** (impossible dans le conteneur) :
- Les scripts PowerShell n'ont **jamais été exécutés** (pas de Windows, pwsh refusé) : seulement parsés par PowerShell 5.1 et analysés en CI.
- L'app desktop Deezer elle-même (le switch `--remote-debugging-port` dans Electron 38 de Deezer, le chemin d'install réel, le comportement de la zone de notification).
- Lecture audio réelle (volume, seek, cœur) : volontairement **aucune action** sur le compte (pas de lecture, pas de like) ; la logique est testée sur la fixture.
- Page de résultats de recherche (taper une recherche aurait ajouté une entrée à l'historique du compte).
- Firefox.

### Règles pour tester sur le compte de l'utilisateur

- Lecture seule : pas de like, pas d'ajout, pas de lecture de titre, pas de recherche tapée. Toute action notée dans un journal (`account-actions.log`, hors dépôt).
- Le script de test bloque au niveau réseau toute requête qui modifie le compte (`gw-light.php?method=…add|remove|set|log…`, mutations GraphQL, flux média).
- **Jamais de cookies dans le dépôt** (`*cookies*.json` est ignoré). Le fichier `deezer.com_cookies.json` poussé par l'utilisateur a été retiré de la branche mais reste dans l'historique Git : l'utilisateur régénère sa session à la fin.

## 8. Backlog (par priorité)

1. **Tests réels de l'utilisateur** (Windows + Chrome) et corrections : voir la liste dans le résumé de session.
2. Recommandations, côté client (onglet déjà présent, marqué « Bientôt ») :
   - Curseur **Familier ↔ Découverte** pour Flow et mixes (filtrer / réordonner : déjà liké vs jamais écouté).
   - « Pourquoi ce titre ? » (artiste similaire / écouté N fois / genre) à partir des données de la page.
   - Éviter les répétitions 7 jours ; accueil selon l'heure (ordre des sections).
   - « Ne plus me recommander » accessible depuis le menu ⋯ (aujourd'hui seulement dans les réglages ; filtre texte simple, à affiner par id d'artiste).
3. Clic milieu sur une carte = ajouter à la file (piloter le menu contextuel).
4. Accueil : ordre des sections (glisser-déposer dans les réglages), « Reprendre l'écoute » épinglé.
5. Aperçu du temps au survol de la barre de progression (Deezer a un tooltip natif, à restyler).
6. Lignes de pistes : numéro → ▶ au survol (Deezer met déjà ▶ sur la pochette).
7. Page de résultats de recherche à styler (à vérifier sans polluer l'historique : compte de test).
8. Publication Chrome Web Store / Edge / Firefox (manifest `browser_specific_settings` pour Firefox).
9. Icônes maison (artboard Main) à la place des icônes Tempo, si l'utilisateur le veut.

## 9. Conventions

- Branche de travail : `claude/modest-davinci-kgm2qs`. Pas de PR sans demande explicite.
- Messages de commit en anglais, impératif. Un commit par point.
- Toute nouvelle ancre → `core/10-anchors.js` (+ `BD.optionalAnchors` si elle n'existe que quand un overlay est ouvert).
- Toute nouvelle couleur → token d'abord (`00-tokens.css`, sombre ET clair).
- Toute nouvelle feature → `label` [fr, en] pour apparaître dans les réglages.
- Garder `npm run build` sans dépendance. `npm test` utilise le Playwright installé globalement (CI : installé à la volée).
- Après un changement visuel : `npm run build && npm test`, puis regarder `test/.out/*.png`.

## 10. Journal

- 2026-11-06 — Session 1 : design system « Graphite » + écrans ; étude de Deezer desktop 8.0.10 ; squelette surcouche ; ce fichier.
- 2026-11-06/07 — Session 2 : analyse du bundle web (ancres réelles, jetons Tempo) ; points 1 à 8 ; intégration des artboards HomeLight / Overlays / Settings ; rework des pages ; tests sur le vrai site (anonyme puis compte de l'utilisateur en lecture seule) ; passes de design : alignement de la salutation, prénom chargé tard, photos rondes artiste/profil, teinte claire 12 %, scrollbar du rail replié (icônes décentrées de 5 px), popover de recherche aligné sur le champ + pied de raccourcis (ordre CSS), noms de sections sans « Voir tout », modale à une seule surface, interrupteurs lisibles en clair, en-têtes collants du rail opaques, barre du haut givrée. Lanceur : `Page.enable` indispensable (trouvé par test), `install.ps1` ASCII + `setup.ps1` avec BOM.
