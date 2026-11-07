# Better Deezer

**Un Deezer plus propre et plus moderne.** Thèmes, Marketplace, paroles synchronisées, lecteur flottant et des dizaines de petites améliorations, pour l'application Windows et le lecteur web. L'équivalent de Spicetify, pour Deezer.

[Installer](#installer) · [Ce qui change](#ce-qui-change) · [La commande `better-deezer`](#la-commande-better-deezer) · [Documentation](#documentation) · [In English](README.md)

> Projet non officiel, sans lien avec Deezer. Il ne modifie que l'apparence et le comportement de Deezer sur votre propre machine. Pas de compte, pas de statistiques, pas de serveur : voir [Confidentialité](docs/privacy.md) (en anglais).

## Installer

### Application Windows

Ouvrez **PowerShell** (pas cmd) et collez :

```powershell
irm https://github.com/Gabizoc/Better-Deezer/releases/latest/download/install.ps1 | iex
```

C'est tout : ouvrez Deezer comme d'habitude, depuis son propre raccourci. Better Deezer modifie l'application Deezer elle-même : pas de deuxième application, pas besoin de droits administrateur, et les mises à jour de Deezer sont gérées pour vous.

Sans la commande PowerShell : téléchargez `better-deezer-windows.zip` depuis les [Releases](https://github.com/Gabizoc/Better-Deezer/releases), décompressez-le, puis clic droit sur `install.ps1` > *Exécuter avec PowerShell*.

### Navigateur (Chrome, Edge, Brave, Opera)

1. Téléchargez `better-deezer-extension.zip` depuis les [Releases](https://github.com/Gabizoc/Better-Deezer/releases) et décompressez-le.
2. Ouvrez `chrome://extensions` (ou `edge://extensions`) et activez le **Mode développeur**.
3. **Charger l'extension non empaquetée** > choisissez le dossier décompressé, puis rechargez deezer.com.

### Userscript

Installez `better-deezer.user.js` depuis les [Releases](https://github.com/Gabizoc/Better-Deezer/releases) avec Violentmonkey ou Tampermonkey. Utilisez l'extension **ou** le userscript, pas les deux.

## Ce qui change

**Des thèmes, façon Spicetify**
- 6 thèmes inclus, clair / sombre / auto
- Une **Marketplace** de thèmes de la communauté, installation depuis un lien ou un fichier
- Un **éditeur de thèmes** avec aperçu en direct et contrôle de lisibilité. Un thème est un simple fichier JSON : [créer le vôtre](docs/themes.md)

**Des modules** à activer ou couper en direct ([liste](docs/modules.md))
- **En écoute** (`F`) : grande pochette et **paroles synchronisées**, mot à mot quand Deezer les a ; cliquez une ligne pour y aller
- **Transitions douces**, **Masquer les promos**, **Minuteur de sommeil** avec fondu du volume
- **Accent selon la pochette**, **Mode compact**

**Une nouvelle mise en page**
- Recherche toujours centrée dans la barre du haut, avec un bouton **Accueil** rond (`Ctrl K`)
- Une **barre latérale flottante**, centrée à l'écran, et un **lecteur flottant** : bouton lecture rond, cœur plein quand le titre est aimé, barre de progression fine
- En-têtes d'album et d'artiste teintés par la pochette, listes de titres plus sobres, filtre **Masquer les titres explicites**
- Fenêtres, menus, notifications, menu du profil et messages restylés

**Du confort**
- **Volume** : un clic déplie un curseur, molette dessus (pas de 5 %, 1 % avec Maj), clic milieu pour couper le son
- **Avancer à la molette** sur la pochette du lecteur (5 s)
- **Accueil** : un message d'accueil, des sections à masquer, un ordre au choix (*Familier*, *Découverte*, selon l'heure), une liste locale **Ne plus me recommander**
- **Barre latérale** : afficher, masquer et réordonner les entrées de Deezer
- `Q` ouvre la file d'attente ; les raccourcis de Deezer marchent toujours (`Espace`, `M`, `L`, flèches, `H` pour la liste)

Tout se règle dans les **Réglages Better Deezer** : `Ctrl ,`, ou depuis le menu du profil. Le [guide](docs/guide.md) (en anglais) détaille chaque option.

## La commande `better-deezer`

L'installation Windows ajoute une commande, comme `spicetify`. Ouvrez un **nouveau** terminal après l'installation :

| Commande | Ce qu'elle fait |
| --- | --- |
| `better-deezer status` | Version installée, version de Deezer, Deezer modifié ou non, mise à jour disponible ou non |
| `better-deezer update` | Installe la dernière version après vérification des sommes SHA-256 (`-f` : réinstaller la même version) |
| `better-deezer apply` | Remodifie Deezer, par exemple juste après une mise à jour de Deezer |
| `better-deezer restore` | Remet Deezer d'origine, garde Better Deezer installé (`apply` le remet) |
| `better-deezer restart` | Relance Deezer |
| `better-deezer logs` | Dernières lignes du journal |
| `better-deezer uninstall` | Désinstalle Better Deezer et remet Deezer d'origine (`-y` : sans question) |
| `better-deezer version` | Affiche la version installée |

### Désinstaller

`better-deezer uninstall`, ou *Paramètres Windows > Applications > Better Deezer > Désinstaller*. Deezer est remis exactement comme avant. Dans le navigateur, supprimez l'extension.

<details>
<summary><b>Comment fonctionne la modification de Deezer</b></summary>

L'application Deezer est une application Electron qui affiche deezer.com. `patch.ps1` ajoute quelques lignes à `build/main.js` dans le fichier `resources\app.asar` de Deezer, et garde l'original sous le nom `app.asar.bd-backup`. À chaque chargement de deezer.com, ces lignes lisent `%LOCALAPPDATA%\BetterDeezer\better-deezer.user.js` et l'exécutent dans la page. Si le fichier n'existe plus, Deezer tourne sans modification. Le correctif n'ouvre aucun port et ne fait aucune requête.

Une mise à jour de Deezer remplace `app.asar`. L'installation enregistre `patch.ps1 -Quiet` à l'ouverture de session pour remettre le correctif, et `better-deezer apply` le fait à la demande.

Tout se trouve dans `%LOCALAPPDATA%\BetterDeezer` : les scripts (en texte clair, lisibles), le skin, `config.json`, `patch.log`, et `bin\better-deezer.cmd`, qui est dans le PATH de l'utilisateur.

</details>

## Documentation

| Page | Contenu |
| --- | --- |
| [Dépannage](docs/fr/depannage.md) | Symptômes, messages d'erreur et solutions |
| [User guide](docs/guide.md) | Chaque fonction, les réglages, les raccourcis, où sont stockés les réglages (en anglais) |
| [Themes](docs/themes.md) | Le format des thèmes, l'éditeur, la publication sur la Marketplace (en anglais) |
| [Modules](docs/modules.md) | Ce que fait chaque module, et comment en écrire un (en anglais) |
| [Privacy](docs/privacy.md) | Ce qui reste sur votre machine (tout) et les seules requêtes faites (en anglais) |

**Quelque chose ne va pas ?** Ouvrez *Réglages Better Deezer > À propos* : la page liste les éléments de Deezer introuvables et permet de couper Better Deezer (`Ctrl ,` le réactive). Puis voyez le [Dépannage](docs/fr/depannage.md).

Pour contribuer (compilation, tests, publication d'une version) : la section *Development* du [README anglais](README.md#development) et [HANDOFF.md](HANDOFF.md).

## Licence

MIT
