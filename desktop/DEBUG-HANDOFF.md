# Passation : pourquoi l'app desktop (Windows) ne marche pas

> À lire par un Claude Code lancé **sur le PC Windows de l'utilisateur**, dans un clone du dépôt `Gabizoc/Better-Deezer` (branche `main`).
> Langue avec l'utilisateur : français. Code, commentaires et commits : anglais.
> Lis aussi `HANDOFF.md` (architecture complète). Ce fichier-ci ne traite que de l'app desktop.

## 0. Symptôme

À demander à l'utilisateur en premier si ce n'est pas écrit ici :
- Que se passe-t-il quand il clique sur le raccourci *Better Deezer* ? Rien ? Deezer s'ouvre sans le skin ? Une fenêtre d'erreur « Better Deezer: … » ? Deezer s'ouvre puis se ferme ?
- Comment a-t-il installé ? `irm … | iex` (impossible pour l'instant, voir §5), zip + `install.ps1`, ou `setup.ps1` depuis un clone ?

**Important** : rien de l'app desktop n'a jamais été exécuté sur un vrai Windows. Tout a été écrit et testé dans un conteneur Linux. La séquence CDP a été rejouée contre Chromium (`test/cdp-inject.mjs`), et les scripts PowerShell n'ont été vérifiés qu'en analyse statique (parse PS 5.1 et PSScriptAnalyzer en CI). Il faut donc s'attendre à des bugs « bêtes » propres à Windows.

## 1. Comment c'est censé marcher

L'app Deezer desktop est **Electron (38.x) qui charge `https://www.deezer.com`**. Son interface est donc le site web, et le skin est le même JS/CSS que l'extension (`dist/better-deezer.user.js`, CSS embarqué).

On ne modifie aucun fichier de Deezer. On l'injecte par le **Chrome DevTools Protocol (CDP)** :

1. **Installation** :
   - `desktop/install.ps1` (amorce 100 % ASCII) lance `desktop/setup.ps1` (UTF-8 avec BOM).
   - `setup.ps1` copie `launcher.ps1`, `uninstall.ps1` et `better-deezer.user.js` dans `%LOCALAPPDATA%\BetterDeezer\`.
   - Il écrit `config.json` (`DeezerPath`, `Version`) au même endroit.
   - Il crée les raccourcis : `powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "...\launcher.ps1"`, avec l'icône de Deezer.
   - Il ajoute une entrée dans *Paramètres > Applications* (clé HKCU).
2. **Lancement** (`desktop/launcher.ps1`) :
   1. Trouve `Deezer.exe` : d'abord `config.json`, puis `%LOCALAPPDATA%\Programs\deezer-desktop\Deezer.exe`, `Programs\Deezer`, Program Files, et enfin les clés Uninstall du registre.
   2. **Ferme Deezer s'il tourne** (sinon son verrou d'instance unique ignorerait nos arguments). Il essaie `CloseMainWindow()`, attend 5 s, puis fait `Stop-Process -Force`.
   3. Lance `Deezer.exe --remote-debugging-port=<port libre> --remote-allow-origins=http://127.0.0.1:<port>`.
   4. Toutes les 2 s, interroge `http://127.0.0.1:<port>/json/list`. Pour chaque cible `type=page` dont l'URL est en `https://…deezer.com/` :
      - ouvre un WebSocket CDP (`System.Net.WebSockets.ClientWebSocket`) ;
      - envoie `Page.enable` (**obligatoire** : sans lui, le script ajouté n'est pas rejoué au rechargement) ;
      - envoie `Page.addScriptToEvaluateOnNewDocument` avec le payload ;
      - puis `Runtime.evaluate` du payload si `window.__betterDeezer` est absent.
   5. Garde les sockets ouverts tant que Deezer tourne : le script ajouté disparaît si la session CDP se ferme.
3. **Dans la page**, `src/main.js` démarre seulement si `window.top === window` et que l'hôte est `*.deezer.com`. Il attend `DOMContentLoaded` si l'injection a lieu tôt.

## 2. Où regarder d'abord

| Quoi | Comment |
| --- | --- |
| Journal du lanceur | `%LOCALAPPDATA%\BetterDeezer\launcher.log` (+ `.old`). On doit y voir `start: …`, `Deezer started, DevTools on 127.0.0.1:<port>`, `attached to …`, `injected into …`. La **dernière ligne** situe le point de blocage. |
| Le lanceur en console, sans fenêtre cachée | `powershell -NoProfile -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\BetterDeezer\launcher.ps1" -Verbose` |
| Les processus Deezer et **leur ligne de commande** | `Get-CimInstance Win32_Process -Filter "Name='Deezer.exe'" \| Select ProcessId,ParentProcessId,CommandLine` |
| Le port est-il ouvert ? | `Get-NetTCPConnection -State Listen \| ? LocalAddress -eq '127.0.0.1'`, puis `irm http://127.0.0.1:<port>/json/version` |
| Test à la main, sans le lanceur | Quitter Deezer (icône de la zone de notification > Quitter), puis `& "$env:LOCALAPPDATA\Programs\deezer-desktop\Deezer.exe" --remote-debugging-port=9222 --remote-allow-origins=*`, et ouvrir `http://127.0.0.1:9222/json/list` dans Chrome |
| Le skin est-il dans la page ? | Depuis `http://127.0.0.1:<port>` dans Chrome (DevTools distants), console : `window.__betterDeezer`, `__betterDeezer.health()` |
| Version de Deezer | Propriétés de `Deezer.exe`, ou `resources\app.asar` (étudiée en 8.0.10) |

## 3. Hypothèses, de la plus probable à la moins probable

1. **`Deezer.exe` ne reçoit pas nos arguments, ou les perd** :
   - c'est peut-être un petit lanceur qui relance le vrai exécutable sans les flags ;
   - ou une autre instance (zone de notification, démarrage auto, mise à jour) prend le verrou d'instance unique, et notre lancement lui passe la main puis s'arrête.

   Vérifier la `CommandLine` des processus (§2). Si `--remote-debugging-port` n'y est pas, ou si le port n'écoute pas, c'est ça.

   Pistes :
   - vérifier que `Get-Process -Name 'Deezer'` attrape bien tous les processus (nom exact, majuscules) ;
   - attendre réellement la fin des processus ;
   - utiliser le bon exécutable.
2. **Le port ne s'ouvre pas du tout** :
   - Deezer peut désactiver `--remote-debugging-port` en production (vérifier dans `app.asar` : `app.commandLine`, `removeSwitch`, `DZ_DEVTOOLS`, détection d'un débogueur) ;
   - Chromium récent refuse ce flag avec le profil par défaut (règle de Chrome 136 et plus, normalement côté navigateur Chrome, pas Electron, mais à vérifier).

   Test : §2, « test à la main ». Si `/json/list` ne répond pas, essayer d'ajouter `--user-data-dir` (attention : cela changerait de profil, donc déconnecterait l'utilisateur. **À ne pas faire sans son accord**) ou la variable d'environnement `DZ_DEVTOOLS=yes`.

   Plan B documenté : patcher `resources\app.asar` (possible, car l'intégrité asar est désactivée dans les fuses). Cela **modifie Deezer**, sera écrasé par les mises à jour et demande l'accord explicite de l'utilisateur.
3. **Le port répond mais rien n'est injecté** :
   - l'URL des pages n'est peut-être pas `https://www.deezer.com/…` (autre domaine, `app://`, `file://`, iframe) : comparer avec le filtre du lanceur `^https://([a-z0-9-]+\.)*deezer\.com/` et la garde de `src/main.js` ;
   - `Runtime.evaluate` peut échouer (lire l'erreur dans le log : `target … : CDP … failed`) ;
   - le payload peut faire planter la page (console des DevTools distants).
4. **PowerShell / Windows** :
   - stratégie d'exécution ou fichiers bloqués (« Mark of the Web » : `Unblock-File`) ;
   - encodage : `setup.ps1` et `launcher.ps1` doivent être en UTF-8 **avec BOM**, sinon PS 5.1 lit en ANSI ;
   - `ClientWebSocket` ou TLS ;
   - fenêtre cachée : les erreurs s'affichent normalement dans une MessageBox « Better Deezer: … ».
   - Lancer en console avec `-Verbose` pour tout voir.
5. **Le lanceur s'arrête trop tôt** : il quitte si Deezer n'est pas vivant après 10 s, ou après plus de 30 échecs et 60 s. Une longue mise à jour de Deezer au démarrage peut le tromper.

## 4. Outils dans le dépôt

- `npm run build` (Node 18+, sans dépendance) produit `dist/better-deezer.user.js`.
- `node test/cdp-inject.mjs` rejoue la séquence CDP du lanceur contre Chromium sur le vrai deezer.com. Il demande Playwright (`npm i -g playwright`, puis `npx playwright install chromium`).
- `npm test` lance les vérifications sur une page de test (fixture) qui imite Deezer.
- Installer depuis un clone :
  ```
  npm run build
  powershell -ExecutionPolicy Bypass -File desktop\setup.ps1
  ```
  Si `dist\better-deezer.user.js` existe, `setup.ps1` le prend.
- Désinstaller : `%LOCALAPPDATA%\BetterDeezer\uninstall.ps1`.

## 5. À savoir

- `irm https://github.com/Gabizoc/Better-Deezer/releases/latest/download/install.ps1 | iex` **ne peut pas marcher aujourd'hui** :
  - le dépôt est privé ;
  - aucune release n'existe (le tag `v1.0.0` n'a jamais été poussé) ;
  - dans Windows PowerShell 5.1, il faut d'abord `[Net.ServicePointManager]::SecurityProtocol = 'Tls12'`.

  Installer depuis le zip ou un clone.
- Le lanceur doit rester en **PowerShell pur, compatible 5.1** (pas de PS 7, pas de module externe). La CI vérifie le parse PS 5.1, PSScriptAnalyzer et le fait que `install.ps1` reste en ASCII.
- Toute erreur visible nouvelle doit être ajoutée à `docs/troubleshooting.md` et `docs/fr/depannage.md`.

## 6. Règles (demandées par l'utilisateur)

- **Compte Deezer en lecture seule** : pas de like, pas d'ajout, pas de recherche tapée, pas de lecture de titre sans le lui demander. Noter toute action faite sur le compte.
- **Jamais de cookies, jetons ou `arl` dans le dépôt** ni dans un message. `*cookies*.json` est ignoré par git.
- Ne pas modifier l'installation de Deezer (`app.asar`, etc.) ni changer de profil (`--user-data-dir`) sans accord explicite.
- Travailler sur `main`. Un commit par point, message en anglais à l'impératif, avec la ligne finale `Co-authored-by: Gabizoc <92862440+Gabizoc@users.noreply.github.com>`. Pas de PR sans demande.
- Une fois trouvé et corrigé : mettre à jour `HANDOFF.md` (§5 « Stratégie d'injection desktop », §7 état, §10 journal), en notant ce qui a été **réellement vérifié sur Windows**.

## 7. Ce qu'il faut rapporter à l'utilisateur

- La cause, avec la preuve : la ligne du log, la ligne de commande du processus, la réponse ou l'absence de réponse de `/json/list`.
- Le correctif et comment il a été vérifié (skin visible dans l'app, `__betterDeezer.health()`).
- Ce qui reste incertain.
