# Samoth Companion V2

## Reprise

La PR #21 a été fusionnée dans `d6fea63`. La PR #22, intégrée dans `18b92fe`, contient la première correction de surbrillance et la séparation de Groupe. La branche V2 part de `18b92fe`.

Audit initial. Combat affichait une description longue dans le lanceur. Le grimoire ouvrait systématiquement la description et renvoyait vers Combat pour préparer un lancement. Les glyphes étaient partagés par famille. La couronne prenait 280 px à 1180 × 820 et l’Emprise pouvait s’activer avant la réponse d’Encounter. Le catalogue possédait le calcul N6, mais omettait la référence Aide DD et les règles des objets. Le popup avait un délai générique de 850 ms.

## Changements

- Sub-Zero. Cristaux latéraux vectoriels, brume statique, fond graphite et états de tour distincts. Le blob de l’emblème original est `09c6a0ed70a8ed1fb567975c54c6169ba2b83d30`.
- Combat. Lanceur compact, Flammes pures en dépliage, économie du tour et ressources existantes. Le panneau flottant de résultat laisse passer les commandes de combat.
- Malachor. Éveillé par défaut avec conservation des choix enregistrés, suivi de l’Écho de Vecna, Détection des pensées et Suggestion en concentration, Emprise conditionnée aux dégâts d’un sort N1+ et usages restaurés au repos long. En mode MJ, les résultats effectifs d’Encounter peuvent déclencher l’Emprise.
- Grimoire. Recherche sans accents, favoris, filtres et liste à défilement interne. Le formulaire de lancement est partagé avec Combat. Les sorts du bâton restent accessibles dans Combat. 24 glyphes distincts couvrent le catalogue et le bâton.
- Désintégration. [Référence Aide DD 2014](https://www.aidedd.org/dnd/sorts.php?vf=desintegration). En autonome, le joueur renseigne le JdS d’une créature. La destruction des objets et l’état fictionnel à 0 PV sont décrits sur la fiche. Encounter reste maître de l’application réseau des dégâts et des effets.
- FX. Noyau à gauche, charge, rayon vers la droite, impact et dissipation. Le résultat est révélé à la fin de la scène ou après son délai de secours. Les coûts, l’historique et l’émission réseau restent synchrones avec le lancement.

## Recette

`npm test` et `npm run test:e2e`, avec `E2E_BROWSER=webkit` pour WebKit. Les captures sont écrites dans `artifacts/companion-v2`. Le profil zoom modélise la réduction de la zone CSS à 944 × 656, soit 125 % par rapport à 1180 × 820.

| Profil iPad | Malachor avant | Malachor après |
| --- | ---: | ---: |
| 1180 × 820 | 280 px | 117 px |
| 944 × 656 | 299 px | 117 px |

Les scénarios RPG Connect utilisent les contrats locaux et une simulation de l’autorité Encounter. Une recette avec iPad physique et une table Encounter réelle reste à faire. Les 8 tests Fizban de Pilot20 (`9f65052`) passent. Son code et le format de sauvegarde de Samoth restent inchangés.

Exécution locale. 25/25 tests unitaires et quatre scripts de recette réussis sur Chromium et WebKit. Les requêtes des scénarios Companion sont limitées au serveur local. Les captures WebKit donnent 286 → 117 px sur iPad paysage et 305 → 117 px avec la zone CSS réduite.

## Icônes validées

Les 24 illustrations de la planche validée sont livrées en WebP sans perte, 128 × 128 px, avec canal alpha. Le fond et le contour de la tuile sont gérés en CSS. Format Kobe : 40 px en liste, 34 px en vue compacte et 60 px sur la fiche. Combat affiche la même illustration en 34 px, y compris pour les sorts du bâton.
