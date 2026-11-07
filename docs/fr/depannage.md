# Dépannage

Premier réflexe : ouvrez les *Réglages Better Deezer* (`Ctrl ,`) > **À propos**. La ligne **Éléments de Deezer reconnus** indique si Better Deezer reconnaît la page de Deezer. « Tout est en place » : le problème est ailleurs. Une liste de noms : Deezer a changé quelque chose (voir [Après une mise à jour de Deezer](#après-une-mise-à-jour-de-deezer)).

In English: [Troubleshooting](../troubleshooting.md) (plus détaillé).

## Rien ne change sur deezer.com

| Vérifier | Solution |
| --- | --- |
| L'extension est-elle activée ? | `chrome://extensions` (ou `edge://extensions`) : *Better Deezer* activé, sans bouton rouge *Erreurs*. Rechargez deezer.com. |
| L'avez-vous désactivé ? | Appuyez sur `Ctrl ,` sur deezer.com : une fenêtre propose de le réactiver. |
| Le bon site ? | Better Deezer ne tourne que sur `www.deezer.com` (pas `account.deezer.com`). |
| Après avoir décompressé une nouvelle version | Cliquez sur la flèche de rechargement de la carte de l'extension, puis rechargez deezer.com. |
| Une autre extension ou un userscript Deezer | Désactivez-le : deux skins se battent pour les mêmes éléments. |
| Userscript | Une seule copie installée (extension **ou** userscript), autorisée sur deezer.com. |

## Après une mise à jour de Deezer

Better Deezer ne dépend jamais des noms de classes générés par Deezer, seulement de repères stables (`data-testid`, rôles ARIA) : la plupart des mises à jour passent sans souci. Sinon :

1. *Réglages > À propos* liste les éléments **introuvables**.
2. Désactivez la fonction qui semble cassée, ou tout Better Deezer (*Désactiver Better Deezer*) : Deezer se recharge sans modification.
3. [Signalez-le](#signaler-un-problème) avec la liste.

Une fonction qui plante est coupée automatiquement pour la session : une seule partie cassée ne casse jamais le reste.

## Application Windows

| Symptôme | Cause et solution |
| --- | --- |
| Texte rouge sur la *stratégie d'exécution* | Lancez la commande dans **Windows PowerShell** (pas cmd), ou clic droit sur `install.ps1` > *Exécuter avec PowerShell*. Pas besoin de droits administrateur. |
| *Installation annulée : Deezer.exe introuvable* | L'installateur cherche aux emplacements habituels puis demande le chemin complet de `Deezer.exe` (Entrée annule). Installez d'abord l'application Deezer, ou indiquez le chemin avant : `$env:BD_DEEZER_PATH = "C:\chemin\vers\Deezer.exe"`. |
| Le raccourci *Better Deezer* ouvre Deezer sans le skin | Deezer tournait déjà dans la zone de notification : quittez-le depuis son icône et relancez *Better Deezer*. Puis lisez le journal (ci-dessous). |
| *Deezer is already running* | Lancé avec `-KeepRunning` : quittez Deezer et relancez. |
| *CDP … failed* / *CDP socket closed* dans le journal | Deezer s'est fermé pendant l'injection. Relancez. Si ça se répète, signalez-le avec le journal. |
| Alerte antivirus | Le lanceur est un script PowerShell qui démarre Deezer avec un port de débogage sur `127.0.0.1`. Les scripts sont lisibles dans `%LOCALAPPDATA%\BetterDeezer\`. |
| Désinstaller | *Paramètres Windows > Applications > Better Deezer > Désinstaller*. Deezer n'est jamais modifié. |

**Journal** : `%LOCALAPPDATA%\BetterDeezer\launcher.log` (collez `%LOCALAPPDATA%\BetterDeezer` dans la barre d'adresse de l'Explorateur).

## Thèmes

| Message | Signification et solution |
| --- | --- |
| *Hors ligne : thèmes de la communauté inclus dans cette version.* | La Marketplace n'a pas pu télécharger la liste à jour depuis GitHub (hors ligne, bloqué, ou dépôt privé). Les thèmes inclus fonctionnent. |
| *invalid link* / *the link must start with https://* | Il faut un lien direct `https://` vers le fichier `.json` (sur GitHub : le lien **Raw**). |
| *download failed (HTTP 404)* | Lien faux ou fichier privé. |
| *download failed: Failed to fetch* | Le site refuse le téléchargement depuis deezer.com : téléchargez le fichier et utilisez *Installer depuis un fichier*. |
| *Impossible d'enregistrer : …* | Le thème est invalide ; chaque point dit quoi corriger. Format : [Themes](../themes.md). |
| Avertissements de contraste dans l'éditeur | Pas une erreur : le thème s'enregistre, mais certains textes seront peu lisibles. |
| Clair / sombre ne change rien | Le thème n'a qu'une palette (ex. *Aurora*, sombre uniquement). |

## Paroles et vue « En écoute »

| Message | Signification |
| --- | --- |
| *Recherche des paroles…* | Requête à lrclib.net, en général moins d'une seconde. |
| *Pas de paroles trouvées pour ce titre.* | LRCLIB n'a pas ce titre. Tout le monde peut en ajouter sur [lrclib.net](https://lrclib.net). |
| *Instrumental ♪* | LRCLIB indique un morceau instrumental. |
| *Paroles indisponibles (connexion à lrclib.net impossible).* | Hors ligne, ou un pare-feu / bloqueur de pub bloque `lrclib.net`. |
| Paroles décalées | LRCLIB a trouvé une autre version (radio edit, live). Seules les versions à moins de 8 s de la durée du titre sont acceptées. |
| `F` ne fait rien | Vous tapez dans un champ, ou le module est désactivé (*Réglages > Modules*). |

## Modules

| Module | En cas de souci |
| --- | --- |
| Accent selon la pochette | Garde l'accent du thème si la pochette n'a pas pu être lue ; le titre suivant fonctionne en général. |
| Minuteur de sommeil | Il vit dans la page ouverte : recharger ou fermer Deezer l'annule. Le volume est remis à son niveau après la pause. |
| Masquer les promos | Purement visuel. Si un bandeau apparaît encore, c'est un nouveau : signalez son texte. |
| Transitions | Coupées automatiquement si le système demande moins d'animations. |

## Console

`F12` > *Console*. Avec l'extension, choisissez le contexte **Better Deezer** dans la liste déroulante pour utiliser `__betterDeezer` :

```js
__betterDeezer.health()            // éléments de Deezer reconnus
__betterDeezer.features()          // chaque fonction : active, en échec
__betterDeezer.disable("volume")   // couper une fonction ( .enable("volume") pour annuler )
```

## Signaler un problème

Ouvrez une issue avec : navigateur ou application Windows, ce que vous avez fait, la ligne **Éléments de Deezer reconnus** (ou la sortie de `__betterDeezer.health()`), les dernières lignes de `launcher.log` pour l'application Windows, et une capture d'écran.

Ne collez jamais de cookies, de jetons ni votre valeur `arl` : personne n'en a besoin pour déboguer Better Deezer.
