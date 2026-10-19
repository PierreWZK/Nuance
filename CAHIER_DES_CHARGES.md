# Jour 1/30 — Nuance, le générateur de palettes

> Stack : **HTML, CSS et JavaScript**, sans bibliothèque ni étape de construction · hébergement **Coolify** (site statique), sous-domaine `nuance.projectp.fr`.
> Rédigé après la livraison, à partir du code : ce document décrit ce qui a été construit et sert de référence pour les évolutions.

## 1. L'idée

Trouver cinq couleurs qui vont ensemble prend du temps. **Nuance** en propose une palette harmonieuse à chaque appui sur **Espace** : on verrouille les couleurs qui plaisent, on relance le reste, puis on copie le résultat dans son CSS.

## 2. MVP — ce qui doit fonctionner

1. Une **page vitrine** (`index.html`) : présentation, couleur du jour, les modes, les fonctionnalités.
2. Un **générateur** (`generator.html`) : une palette de 5 couleurs, régénérée par Espace ou par le bouton « Générer ».
3. **5 modes d'harmonie** et le **verrouillage** des couleurs.
4. **Copie** du code hexadécimal, **export CSS** et **export PNG**, **partage par lien**.
5. Utilisable au **clavier, à la souris et au doigt**, sur mobile comme sur ordinateur.

### Périmètre volontairement limité

- Pas de compte ni de serveur : la palette vit dans l'adresse de la page.
- Pas de bibliothèque de couleurs : conversions et harmonies sont écrites à la main.

## 3. Cahier des charges fonctionnel

### A. Générer

Chaque mode construit les couleurs en **HSL** autour d'une teinte de base (tirée au hasard, ou celle de la première couleur verrouillée) :

| Mode | Teintes | Saturation / luminosité |
| --- | --- | --- |
| Aléatoire | au hasard | S 40–90 %, L 25–80 % |
| Analogue | base ± 25° par couleur | S 50–80 %, L 35–70 % |
| Complémentaire | base et base + 180°, en alternance | L du foncé au clair |
| Triadique | base, + 120°, + 240° | S 50–80 %, L 35–70 % |
| Monochrome | une seule teinte | L de 15 % à 85 % |

- Les couleurs sont **triées par teinte**, en tenant compte des rouges situés de part et d'autre de 0°.
- Une couleur **verrouillée** est gardée ; les autres sont régénérées autour d'elle.

### B. Personnaliser

- **De 2 à 10 couleurs** : ajouter, supprimer, modifier avec le sélecteur du navigateur.
- Un **nom** par couleur (Corail, Bleu nuit…), choisi d'après la couleur la plus proche d'une liste, et **modifiable**.
- **Glisser-déposer** pour réordonner, à la souris et au tactile.
- Le texte de chaque bande est clair ou foncé selon la couleur, pour rester lisible.

### C. Exporter et partager

- Copie du code hexadécimal en un clic.
- **Export CSS** : variables nommées d'après les couleurs (`--corail`, `--bleu-nuit`).
- **Export PNG** : la palette dessinée avec ses noms et ses codes.
- **Lien de partage** : couleurs et noms sont dans l'adresse ; ouvrir le lien recrée la palette.

### D. Couleur du jour

- Une couleur par jour, **la même pour tout le monde**, calculée à partir de la date.
- Une courte description générée d'après sa teinte, sa saturation et sa luminosité, ses nuances, sa complémentaire, et un lien pour créer une palette autour d'elle.

### E. Interface attendue

- Mobile d'abord : bouton « Générer » fixé en bas de l'écran, outils dans un menu déroulant.
- Raccourci **Espace** ; les actions ont un retour visible (« Copié »).

## 4. Cahier des charges technique

### Architecture

| Fichier | Rôle |
| --- | --- |
| `palette.js` | Logique pure, partagée par les deux pages : HSL ↔ hexadécimal, modes, tri, noms, couleur du jour, description |
| `script.js` | Interface du générateur : rendu, verrouillage, glisser-déposer, exports, partage |
| `landing.js` | Contenus dynamiques et animations de la vitrine |
| `style.css` | Styles des deux pages |

- Aucune dépendance ; seules les polices viennent de Google Fonts (Bricolage Grotesque, Inter).
- L'export PNG dessine la palette dans un `<canvas>`.

### Mise en ligne

Site statique publié tel quel par Coolify à chaque push sur `master`. Les balises Open Graph et `docs/og.png` donnent l'aperçu du lien quand on le partage.

## 5. Critères de réussite

- [x] Une palette harmonieuse à chaque appui sur Espace, dans les 5 modes.
- [x] Une couleur verrouillée ne change pas et guide la palette suivante.
- [x] Le lien de partage recrée exactement la palette (couleurs et noms).
- [x] L'export CSS se colle tel quel dans une feuille de styles.
- [x] Utilisable sur un téléphone, au doigt.

## 6. Pistes d'évolution

- Contraste WCAG entre deux couleurs de la palette.
- Export en JSON ou en thème Tailwind.
- Historique des palettes générées.

## 7. Définition du « terminé »

Les critères de la section 5 sont remplis, le site est en ligne sur `nuance.projectp.fr`, et le README décrit les fonctionnalités et la structure.
