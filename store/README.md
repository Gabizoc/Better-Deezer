# Fiche Chrome Web Store

**En ligne :** https://chromewebstore.google.com/detail/miceabadgmpgdkfgjihkihbgeonlekbb

Tout ce qu'il faut pour remplir le [Developer Dashboard](https://chrome.google.com/webstore/devconsole). À garder en phase avec l'extension.

## Publier une nouvelle version

1. Montez la version dans `package.json`. Chaque envoi doit avoir une version plus haute que celle en ligne.
2. Poussez le tag `vX.Y.Z` : la release GitHub contient `better-deezer-extension.zip`. Sinon, `npm run build` puis zippez le *contenu* de `dist/extension` (`manifest.json` à la racine du zip).
3. Dashboard › **Package** › *Upload new package*, puis **Submit for review**.

## Langues

La fiche existe en 8 langues, selon la [méthode de Chrome](https://developer.chrome.com/webstore/i18n) :

| Langue du store | Nom et résumé | Description |
| --- | --- | --- |
| English (langue par défaut) | [`en`](../extension/_locales/en/messages.json) | [`listing/en.txt`](listing/en.txt) |
| Français | [`fr`](../extension/_locales/fr/messages.json) | [`listing/fr.txt`](listing/fr.txt) |
| Español | [`es`](../extension/_locales/es/messages.json) | [`listing/es.txt`](listing/es.txt) |
| Deutsch | [`de`](../extension/_locales/de/messages.json) | [`listing/de.txt`](listing/de.txt) |
| Italiano | [`it`](../extension/_locales/it/messages.json) | [`listing/it.txt`](listing/it.txt) |
| Português (Brasil) | [`pt_BR`](../extension/_locales/pt_BR/messages.json) | [`listing/pt_BR.txt`](listing/pt_BR.txt) |
| Português (Portugal) | [`pt_PT`](../extension/_locales/pt_PT/messages.json) | [`listing/pt_PT.txt`](listing/pt_PT.txt) |
| Nederlands | [`nl`](../extension/_locales/nl/messages.json) | [`listing/nl.txt`](listing/nl.txt) |

- **Le nom et le résumé** viennent du paquet : le manifeste pointe vers `__MSG_extName__` et `__MSG_extDescription__`, traduits dans `extension/_locales/<langue>/messages.json`. Le store les affiche tout seul dans chaque langue, rien à saisir. La build refuse un résumé de plus de 132 caractères.
- **La description** se saisit à la main : Dashboard › **Store listing**, choisissez la langue dans le menu en haut, collez le fichier `listing/<langue>.txt` correspondant, enregistrez. À refaire pour chaque langue.
- **La langue par défaut** est l'anglais (`default_locale: "en"`) : c'est elle que voient les pays sans traduction. Au premier envoi d'un paquet avec `_locales`, le Dashboard bascule la fiche par défaut sur l'anglais : collez `listing/en.txt` dans *English*, et l'ancienne description française dans *Français*.
- **Ajouter une langue** : un dossier `extension/_locales/<code>` (codes [de Chrome](https://developer.chrome.com/docs/extensions/reference/api/i18n#locales), par ex. `pt_BR`), un fichier `listing/<code>.txt`, une ligne dans ce tableau. L'interface de Better Deezer se traduit à part, dans `src/i18n/`.

## Onglet Store listing

| Champ | Valeur |
| --- | --- |
| Catégorie | **Lifestyle › Entertainment** |
| Icône | `extension/icons/icon-128.png` (source vectorielle : `store/icon.svg`) |
| Petite tuile promo (440×280) | `store/promo/<langue>/small-440x280.png` |
| Grande tuile promo (1400×560) | `store/promo/<langue>/marquee-1400x560.png` |
| Site | https://github.com/Gabizoc/Better-Deezer |
| Assistance | https://github.com/Gabizoc/Better-Deezer/issues |

**Captures** (1280×800, PNG sans transparence), une série par langue dans `store/screenshots/<langue>/`, à déposer dans cet ordre : vue En écoute avec paroles synchronisées, page artiste, album *Ceinture noire*, album *Subliminal* en clair, Réglages Better Deezer. Prises sur le vrai deezer.com (`/en/` ou `/fr/`), déconnecté, skin injecté et réglé dans la langue (GIMS en exemple). En réserve dans `extra/` : En écoute en clair.

**Quelles images pour quelle langue** : dans Dashboard › **Store listing**, les captures et les tuiles se changent par langue, comme la description. `en` sert pour l'anglais et pour toutes les langues sans série dédiée (es, de, it, pt_BR, pt_PT, nl) ; `fr` pour le français.

**Cover GitHub** (1280×640, en anglais comme le README) : `store/social-preview.png`, à envoyer dans Settings › General › Social preview.

## Onglet Privacy practices

**Single purpose**

```text
Restyle and improve the Deezer web player (www.deezer.com): themes, layout, player controls and a lyrics view. It only runs on Deezer's web player.
```

**Permission justification** : l'extension ne demande aucune permission d'API, seulement l'accès à deezer.com par ses content scripts.

```text
Host access to https://www.deezer.com/*: the extension is a skin for the Deezer web player. Its content scripts add the stylesheet and the scripts that restyle the page and add controls (volume, lyrics view, settings). It runs on no other site.
```

**Remote code** : **No, I am not using remote code**.

```text
All JavaScript is in the package. Themes downloaded from the Marketplace (raw.githubusercontent.com) or from a link are JSON data: colors, sizes, font names and CSS. They are validated before use; CSS that could load a resource or run code (url(), @import, expression(), javascript:) is rejected.
```

**Data usage** : cochez seulement

- **Authentication information** : pour les paroles, l'extension demande à auth.deezer.com un jeton de courte durée issu de la session Deezer existante, comme le fait le bouton Paroles de Deezer. Gardé 4 minutes en mémoire, envoyé seulement à Deezer, jamais stocké ni partagé.
- **Website content** : le titre, l'artiste et la durée du morceau en cours partent vers lrclib.net pour trouver des paroles quand Deezer n'en a pas.

Laissez tout le reste décoché et certifiez les trois engagements (pas de vente, pas d'usage sans rapport, pas d'évaluation de solvabilité).

**Privacy policy** : https://github.com/Gabizoc/Better-Deezer/blob/main/docs/privacy.md

## Onglet Distribution

Visibilité **Public**, toutes les régions.
