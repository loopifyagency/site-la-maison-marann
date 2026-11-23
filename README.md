# La Maison Marann — site vitrine

Site one-page du salon de coiffure **La Maison Marann** (7 rue Dupleix, 29200 Brest).
Objectif principal : **prendre rendez-vous** (Planity ou téléphone).

Site statique : HTML, CSS et JavaScript, **sans étape de build**. Les bibliothèques (GSAP, ScrollTrigger,
SplitText, Lenis) et les polices (Young Serif, Hanken Grotesk) sont hébergées dans le dépôt : aucun appel à un CDN ni à Google Fonts.

## Déploiement (GitHub Pages)

Le site est publié par GitHub Pages depuis la branche `main`, à la racine du dépôt (fichier `.nojekyll` présent : aucun build, les fichiers sont servis tels quels).
Adresse : <https://loopifyagency.github.io/site-la-maison-marann/> — tous les chemins du site sont relatifs, il fonctionne donc aussi bien dans ce sous-dossier que sur un domaine personnalisé.

Réglage (une seule fois) : *Settings → Pages → Build and deployment → Source : Deploy from a branch → `main` / `(root)`*.
Chaque fusion dans `main` redéploie le site.

## Voir le site en local

```bash
python3 -m http.server 8000
```

Puis ouvrir <http://localhost:8000>. N'importe quel hébergement statique convient (Netlify, Vercel, GitHub Pages, OVH…) : publier le dossier tel quel.

## Structure

```
index.html            contenu, SEO, données structurées (HairSalon)
css/style.css         système visuel (variables en tête de fichier)
js/main.js            animations, carrousel, statut ouvert/fermé, menu
assets/img/           photos du salon (2 tailles) + textures (carreaux, grain) + favicon
assets/fonts/         Young Serif, Hanken Grotesk (woff2, sous-ensemble latin)
assets/vendor/        gsap, ScrollTrigger, SplitText, lenis
DESIGN.md             palette, typographie, motifs, règles de mouvement
```

## À compléter / vérifier avant la mise en ligne

- **Horaires** : les horaires reçus étaient mélangés (« samedi, 09:30 dimanche, Fermé–17:00 »). Ils ont été lus ainsi :
  lundi–vendredi 09h30–18h00, **samedi 09h30–17h00, dimanche fermé**. À corriger au besoin dans `index.html`
  (section « Nous trouver », pied de page, données structurées) et dans la constante `HOURS` de `js/main.js`.
- **Tarifs** : aucun prix n'a été fourni, donc aucun n'est affiché (la section Prestations renvoie vers le téléphone et Planity).
- **Chiffres clés** : aucun chiffre d'activité n'a été fourni (ancienneté, nombre de clients…). La section utilise des faits vérifiables
  (6 jours sur 7, 2 coiffeurs, ouverture à 9h30, n° 7). À remplacer par les vrais chiffres si le salon le souhaite.
- **Avis** : les 5 avis sont repris mot pour mot (fautes et emojis compris). Aucune note ni étoile n'est affichée, faute de source.
- **Domaine** : une fois l'adresse du site connue, ajouter `<link rel="canonical">`, `og:url`, `og:image` (URL absolue) et un `sitemap.xml`.
- **Mentions légales** : à ajouter (raison sociale, SIRET, hébergeur) ; non fournies.
- **Photos** : les 5 photos fournies sont de petite taille (773 à 1120 px). Elles ont été agrandies ×2 pour un rendu plus net,
  mais des fichiers d'origine en haute définition amélioreraient nettement les grands cadres.
- **Carte** : l'iframe Google Maps est cliquable (ouvre Google Maps dans un nouvel onglet).

## Comportements à connaître

- **Mobile** (≤ 900 px) : animations simplifiées, rituel empilé, prestations en défilement tactile, bouton flottant « Appeler ».
- **`prefers-reduced-motion`** : pas de préchargeur, pas de défilement lissé ni de parallax ; le contenu reste complet.
- **Sans JavaScript** : tout le contenu est visible (les états masqués sont posés par le script, jamais par le CSS).
- Le statut « Ouvert / Fermé » est calculé en direct à l'heure de Paris.
