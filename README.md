# Samoth · Companion V3

Compagnon autonome pour Samoth, ensorceleur draconique argent niveau 10. Déploiement GitHub Pages : ouvrir `index.html`. Aucun framework ni service distant requis.

## Sources et choix

- `Samoth_niveau_10(1).pdf` : PV 72, CA 14, attaque de sort +10, DD 18, caractéristique, inventaire et emplacements 4/3/3/3/2.
- `Grimoire_Samoth_Niveau_10(1).pdf` : sorts, Présent du dragon métallique, Ailes protectrices 4/repos long, Soins gratuit 1/repos long, dragon CA 19/PV 50 et tour immédiatement après Samoth.
- Interface structurée sur Silas : identité à gauche, emblème, constantes, barre sticky, cartes et navigation.
- La fiche retient 10 points de sorcellerie et trois métamagies principales. Le don Adepte de métamagie (+2 points réservés) et Sort intensifié sont configurables car les documents les présentent conditionnellement ou de façon contradictoire.
- Bâton de confluence : les charges Mains (1) et Vortex (3) sont suivies. L'effet exact du bâton n'est pas précisé dans les documents : le MJ le résout à la table.

## Données

Clé `localStorage` : `samoth-companion-v3`. Si aucune sauvegarde V3 n'existe, l'ancien état `samoth-v3` et les surfaces `companion-v3:samoth:<chemin>` sont importés sans effacer ces anciennes clés. Une importation JSON remplace l'état après copie dans `samoth-companion-v3:backup`. L'export JSON comprend ressources, inventaire, journal et notes.

L'annulation restaure l'état complet d'avant la dernière opération mécanique, journal inclus. Les notes libres sont enregistrées directement et restent indépendantes de l'annulation du dernier jet.

## Modules

- Combat : action, bonus, réaction, mouvement, PV temporaires, attaques avec confirmation, 1/20 naturels, concentration, dégâts détaillés.
- Dragon : phase propre après Samoth, PV, deux Déchirements et un Souffle, ordre gratuit ou Esquive, disparition sur 0 PV ou concentration perdue.
- Sorts : 18 options de la fiche et du grimoire, détails repliables, emplacements, métamagie, effets de froid et usages gratuits.
- Ressources : sorcellerie, conversion, fiole, dés de vie, bâton, ailes et flammes pures.
- Social, inventaire illustré, journal, carnet de session et fiches PNJ.

## Limites de règles explicites

Les dés de dégâts sont lancés dans l'application ; les sauvegardes des ennemis sont indiquées par le joueur. Soins peut cibler un allié : le résultat est affiché sans changer automatiquement les PV de Samoth. La régénération de l'anneau en bois et les effets détaillés du bâton demandent validation du MJ.
