# Samoth — correction du don de niveau 8

D&D 5e 2014 : ensorceleur draconique argent 10. Le choix d’ASI de niveau 8 est **Don des dragons métalliques**, Fizban’s Treasury of Dragons (2021), p. 17. Il remplace l’ancien don erroné, sans ajouter un second don.

La fiche enregistrée indique CHA 17. Guérison draconique utilise donc Charisme (+3 actuellement), calculé depuis le profil partagé ; les bonus d’objet aux attaques/DD ne s’ajoutent pas aux soins. Soins reste une seule entrée, hors quota de sorts connus : une utilisation N1 gratuite par repos long ou un emplacement disponible avec sur-incantation.

Métamagies de classe confirmées dans le code existant : Accéléré, Jumeau, Renforcé. Réserve normale 10 SP ; aucun retrait de 2 SP. Intensifié est retiré du sélecteur et refusé par le garde d’incantation, même si un ancien état réactive son indicateur. Le schéma de correction ne propose plus une réserve de don.

Migration additive et idempotente sous `samoth-companion-v3`, au chargement, à la persistance et à l’import : conserve PV, emplacements, SP disponibles, compteurs Ailes/Soins, inventaire, notes et journal. Corrige également les instantanés d’annulation ; aucun effacement de stockage local. Le nom de format JSON et le schéma V3 restent compatibles.

Ailes : quatre utilisations/repos long, réaction et +4 CA contre une seule attaque. En local, confirmation de la touche, portée et visibilité avant consommation ; aucune CA persistante. En connecté, réutilisation de `defensive-ac` : choix local, claim, grant Encounter, consommation idempotente par reactionId. La portée >5 pieds et la visibilité explicitement négative bloquent ; une donnée manquante exige une confirmation à la table. Le contrôle est refait à l’exécution. Projectile magique ne déclenche pas Ailes (aucun jet d’attaque), même si une ancienne requête le propose. Le système existant d’annulation Encounter capture les compteurs et marque les requêtes annulées.

L’autorité de la touche, des dégâts et des PV reste Encounter. La fenêtre `defensive-ac` est traitée avant les dégâts par le protocole existant ; cette PR n’ajoute pas un moteur Encounter. Les tests de descripteurs couvrent disponibilité, validation, refus, changement de portée et répétition du grant. Ils ne constituent pas un essai connecté en conditions réelles avec un MJ.

Validation : `npm test`, `npm run test:e2e` (Chromium/WebKit, largeurs 390 et 1180). Le script navigateur vérifie chargement d’une V3, Soins gratuit/emplacements, Ailes/refus/annulation, import et débordement. Aucun appareil physique n’est impliqué.

Compatibilité : lecture de `Encounter/rpg-samoth-authority.js` et exécution ciblée des tests mécaniques `rpg-samoth-automatismes.test.js` (le test d’installation des six Companions exige leurs checkouts et reste hors périmètre). La suspension précède l’application des dégâts ; les critiques sont conservés, les refus et la reprise sont idempotents, Ailes ne modifie pas la CA persistante.

Résultats locaux : 3 tests unitaires réussis ; 13 tests mécaniques Encounter ciblés réussis ; Chromium 153 aux largeurs 390/1180, tous les scénarios navigateur réussis. WebKit est prévu en GitHub Actions ; pas encore exécuté localement.
