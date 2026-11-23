---
name: La Maison Marann
description: Salon de coiffure à Brest — rustique, chaleureux, laiton et terracotta.
colors:
  noyer: "#3A1507"
  ambre: "#D88F38"
  pierre: "#DFDFDF"
  noyer-profond: "#240B03"
  lin: "#F2EADF"
  terracotta: "#A6482A"
  bordeaux: "#5E1A17"
typography:
  display: "Young Serif (400)"
  text: "Hanken Grotesk (variable 100–900)"
---

# Système visuel

Les couleurs **noyer, ambre et pierre** sont imposées par le client ; les autres en sont dérivées des photos du salon.

## Palette — rôles

| Couleur | Hex | Rôle |
|---|---|---|
| Noyer | `#3A1507` | Imposée. Texte sur clair, fonds sombres (rituel, avis). |
| Noyer profond | `#240B03` | Fond le plus sombre : hero, galerie, pied de page. |
| Ambre | `#D88F38` | Imposée. Laiton des miroirs : accents, boutons d'action, bandeau. Jamais en texte sur fond clair (contraste 2:1). |
| Pierre | `#DFDFDF` | Imposée. Plan de travail en marbre : texte sur sombre, fond de la section chiffres. |
| Lin | `#F2EADF` | Mur chaud : grands fonds clairs (manifeste, avis, contact). |
| Terracotta | `#A6482A` | Carreaux du comptoir : mosaïque, fond des prestations. Texte lin dessus (≥ 4,5:1). |
| Bordeaux | `#5E1A17` | Rideaux : section d'appel à l'action. |

## Typographie

- **Young Serif** pour les titres : empattements robustes et évasés, proches du lettrage de la carte de visite. Titres géants (hero jusqu'à ~14 rem, pied de page ~10 vw).
- **Hanken Grotesk** pour le texte : lisible, chaleureux. Corps 17 px, interligne 1,65, mesure ≤ 65 caractères.
- Le « la » du nom est toujours plus petit et en ambre, comme sur la carte.

## Fil rouge

- **L'arche** : les miroirs triptyques à liseré laiton. Chaque photo est cadrée en arche, avec un fin liseré laiton décalé (`.arch`).
- **Le carreau terracotta** : joints clairs, tons légèrement irréguliers (`assets/img/carreaux.svg`).
- **Séparateurs** : arcade (rangée d'arches) entre sections, « rideau » (ondulation bordeaux) avant l'appel à l'action.
- Grain de papier très léger sur toute la page (`assets/img/grain.png`).

## Mouvement

- GSAP + ScrollTrigger + SplitText ; Lenis pour l'inertie. Courbes `expo` / `power3`, jamais linéaires (sauf le défilement continu du bandeau).
- Priorité à `transform` et `opacity` ; `clip-path` pour les révélations par masque (cercle, rideau, arche).
- Un moment signature : le préchargeur dessine l'arche, puis elle s'ouvre sur le salon.
- Sections pinnées : le rituel (4 temps) et les prestations (défilement horizontal).
- Mobile : animations simplifiées. `prefers-reduced-motion` : version statique complète.

## Accessibilité

Contrastes ≥ 4,5:1 pour le texte courant, focus visible (anneau ambre ou noyer selon le fond), lien d'évitement, carrousel utilisable au clavier,
textes alternatifs sur les photos porteuses de sens, `lang="fr"`.
