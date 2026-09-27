# Companion V3 — audit et contrat de migration

Audit des branches `main` du 27 septembre 2026. Les dépôts restent indépendants ; les deux fichiers `companion-v3.css` et `companion-v3.js` sont copiés à l'identique dans les quatre dépôts pour éviter une dépendance réseau entre Pages. Le moteur propre à chaque personnage reste sa source de vérité.

| Domaine | Référence observée | Décision V3 |
| --- | --- | --- |
| Combat et présentation large | Silas / Pik (cartes, disponibilité et retours) | Cartes lisibles, état utilisé, résultat visible sans ouvrir le journal. |
| Composition téléphone | Zephyr (HUD compact) et Karu (dock, safe areas) | Navigation basse, barre de tour compacte, panneaux verticaux et cibles de 44 px minimum. |
| Inventaire | Kentaro (icônes, catégories) et Karu (état d'objet) | Inventaire à deux vues, quantité, image, actif, harmonisation et sauvegarde indépendante. |
| Social | Silas / Pik et Karu | Caractéristiques, sauvegardes et compétences, jets cliquables selon la fiche connue. |
| Journal et notes | Kentaro (séparation notes / mécanique) | Conserver les journaux mécaniques en place ; notes de session indépendantes, aperçu repliable et fiches PNJ. |
| Undo | Samoth (snapshot de transaction), Karu (notes exclues) | Améliorer les transactions du moteur ; jamais inclure les notes dans l'annulation. Les anciens moteurs n'ont pas encore tous une transaction atomique. |
| Stockage | Karu (import validé et sauvegarde précédente) | Clé par personnage et chemin, schéma explicite, contrôle d'import, copie avant remplacement, export brut en cas de corruption. |
| FX | Chaque personnage | Conserver les FX propres ; réduire l'animation si demandé par le système. |

## Inventaire des moteurs existants

- **Samoth** : PV 72 et temporaires, emplacements N1–N5, 10 points de sorcellerie + 2 réservés à la métamagie, cinq options de métamagie, concentration, soin gratuit, ailes, fiole, bâton, flammes pures, sortilèges de froid/contrôle/soins/réactions et dragon invoqué avec tour propre. Stockage `samoth-v3`. Son Undo n'a qu'un niveau et mélange l'ancienne entrée de journal avec la précédente ; la reprise doit garder le journal intègre. Fichiers `samoth-modern.*` historiques non chargés par `index.html`.
- **Brackmard** : 104 PV, 5d10 de supériorité, 2 attaques, manœuvres et Attaque précise, Fougue, Second souffle, Indomptable, Souffle de la forge, Vigueur naine, Cogneur lourd, Sentinelle/Riposte et aura. Stockage `brackmard-v2`. L'attaque et les réactions engagent actuellement des ressources avant confirmation, et le journal est limité à 100 lignes. Garder le système d'attaque existant jusqu'à sa refonte transactionnelle.
- **Nans** : 125 PV, rage 4, frénésie, téméraire, Volto épée/hache et charge, écorce, cape, Cor d'Urngarak, anneau et épuisement. Stockage `nans-combat-state-v1` avec journal HTML. Risque de l'ancienne sauvegarde HTML, à assainir sans perdre l'historique existant.
- **Rufus** : 53 PV, furtive 5d6, deux lames psychiques, dé psionique évolutif, Frappes autoguidées, Chanceux, Linceul, Ruse, Tireur d'élite, armes et pouvoirs quotidiens. Vérifier le flux de consommation sur raté et les effets du Linceul avant toute modification mécanique. Son rendu est sombre/violet et doit rester contrasté.
- **Pik** : la page charge l'HTML d'un commit GitHub Raw à chaque démarrage ; démarrage hors réseau fragile malgré ses bonnes cartes et sa disponibilité d'action.
- **Karu** : séparation données/moteur/stockage/UI, appui long annulé au scroll, import strict, SW avec cache isolé. Son README signale que Safari tactile n'était pas encore validé. Ne pas répliquer le SW sans test iPhone réel.

## Contrat de données du module commun

`companion-v3.js` gère uniquement les surfaces transversales (inventaire, notes, Social, sauvegarde de ces surfaces et dock). La mécanique et le journal de combat demeurent dans la page du personnage. Les données transversales portent le schéma `1`, une clé `companion-v3:<nom>:<pathname>` et une sauvegarde `:backup`. Une importation validée restaure également l'ancienne sauvegarde mécanique dans sa clé propre ; elle ne remplace pas le moteur par un état inventé. Les données existantes de ces moteurs ne sont pas effacées lors de l'installation.

## Limites vérifiables

Le vrai contrat « moteur commun » et une annulation atomique d'une attaque guidée sur les quatre personnages demandent une migration de leurs moteurs, distincte de l'interface. Aucun bouton de l'interface ne doit prétendre offrir ce comportement tant qu'il n'est pas garanti. L'essai sur Safari physique reste distinct des tests Chromium aux largeurs simulées.
