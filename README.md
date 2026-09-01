# START AND SHIFT — application

Application mobile et web de branding pour les entrepreneurs de Lomé.

Expo SDK 57 · React Native 0.86 · TypeScript 6 (strict) · React Navigation 7 · Zustand 5

## Démarrer

```bash
npm install
npm run web            # navigateur — le vocal passe par l'API du navigateur
npm run typecheck      # tsc --noEmit
```

Sur téléphone, **Expo Go ne suffit plus** depuis que la reconnaissance vocale
est là : c'est un module natif, il faut un build de développement.

```bash
npx expo run:android   # nécessite le SDK Android et un JDK
```

## Test de bout en bout

```bash
npm run e2e            # backend attendu sur http://localhost:3000
API=http://autre:3000 npm run e2e
```

`scripts/e2e.mjs` rejoue tout le parcours client contre l'API réelle :
inscription, diagnostic sauvegardé au fil de l'eau, stratégie (dont les
libellés produits sont comparés aux valeurs attendues), idempotence de
l'ouverture de conversation, contexte figé, envoi de message, réception temps
réel par WebSocket, horodatage hors ligne, révocation de session. Aucune
dépendance : `fetch` et `WebSocket` viennent de Node.

Chaque exécution crée un compte jetable — sans conséquence sur une base de
développement, **à ne pas lancer contre la production**.

Le backend doit tourner en parallèle (`F:\Code\start-and-shift-api`, port 3000).

### Adresse de l'API

`.env` pointe sur `http://localhost:3000`. Cela ne marche que pour le
navigateur et le simulateur iOS. À changer selon la cible :

| Cible | `EXPO_PUBLIC_API_URL` |
|---|---|
| Navigateur, simulateur iOS | `http://localhost:3000` |
| Émulateur Android | `http://10.0.2.2:3000` |
| Téléphone physique | `http://<IP-du-PC>:3000` |

Pour le **web**, le backend doit aussi autoriser l'origine : sans `ALLOWED_ORIGINS`
contenant l'URL d'Expo (par défaut `http://localhost:8081`), le navigateur
bloque toutes les requêtes. Les applications natives ne sont pas concernées.

## État d'avancement

Étapes 1 à 4 de `FRONTEND_SPEC.md` §11 :

- [x] 1 — Projet Expo, arborescence, jetons de design
- [x] 2 — Client API (axios), store d'authentification, JWT persisté
- [x] 3 — Inscription, consentement, AuthStack
- [x] 4 — Diagnostic en 8 questions (texte seul), AppStack
- [x] 5 — Stratégie : chargement animé, 5 sections, erreurs et réessai
- [x] 6 — Mise en relation : ouverture du fil, présence, quatre engagements
- [x] 7 — Chat texte, WebSocket, file d'attente hors ligne, colonne web
- [x] 8 — Vocal : dictée dans le diagnostic et le chat, lecture à voix haute
- [x] 9 — Paiement (manuel, assumé) et comparatif Gratuit / Pro
- [x] 10 — Bibliothèque : grille adaptive, recherche, filtres
- [x] 11 — Suivi de commande
- [x] 12 — Tests de bout en bout du parcours complet

Les douze étapes de `FRONTEND_SPEC.md` §11 sont faites.

Plus aucun écran provisoire : le parcours va de l'inscription au chat.

## Écarts assumés par rapport à FRONTEND_SPEC.md

Le spec a été écrit avant que le backend soit terminé. Là où les deux se
contredisent, **le backend fait foi** — c'est lui qui tourne.

### Contrat d'API

| `FRONTEND_SPEC.md` | Réalité du backend |
|---|---|
| `POST /api/auth/signup` | `POST /api/auth/session/request` puis `/session/verify` — inscription et connexion confondues, code SMS en deux temps |
| `GET /api/auth/me` | `GET /api/me` |
| `phone: "90000000"` | `phone: "+22890000000"` — E.164 complet, validé par `/^\+228\d{8}$/` |
| `POST /api/diagnostic/answer` `{ step, answer }` | `PUT /api/diagnostic` `{ answers: [...] }` — tableau partiel |
| `GET /api/strategy` sondé toutes les 2 s | `POST /api/strategy` — calcul synchrone, réponse immédiate |
| `positioning`, `audiences`, `tone`, `differentiator` | `pos`, `cibles`, `ton`, `diff` |
| Port 4000 | Port 3000 |
| `ws://API_URL?token=` | `ws://API_URL/ws?ticket=` — jeton à usage unique obtenu via `GET /api/ws-ticket`, jamais le JWT |

### Les 8 questions du diagnostic

Le tableau du §6.3 (« Depuis combien de temps ? », « Quel budget branding ? »…)
ne correspond à rien : ni au prototype, ni au calcul de stratégie du backend.
Les vraies questions viennent du prototype v3 (lignes 767-791) et sont dans
`src/constants/questions.ts`.

⚠️ **Ne jamais reformuler les libellés d'options.** `strategy.ts` les compare au
caractère près. Un accent qui change et la stratégie retombe silencieusement sur
ses valeurs par défaut, sans la moindre erreur visible.

### Choix techniques

- **Expo SDK 57**, pas 52 : le 52 est en fin de vie.
- **React Navigation seul**, pas expo-router. Le spec listait les deux ; le §4 et
  le §5 décrivent un `RootNavigator` classique, donc expo-router a été écarté.
- **`native-stack`** plutôt que `stack` : il utilise le navigateur natif de la
  plateforme, plus fluide sur les Android d'entrée de gamme, et évite deux
  dépendances (`gesture-handler`, `reanimated`).
- **Pas de bibliothèque d'icônes.** `@expo/vector-icons` n'est plus fourni avec
  le SDK 57 et embarque des polices entières. `src/components/ui/Icon.tsx`
  utilise des caractères système : zéro octet ajouté. À remplacer quand le chat
  aura besoin d'un vrai jeu d'icônes.
- **Hauteur de bouton 52 px**, contre 42 dans le prototype. Celui-ci est une
  maquette d'écran large ; 42 px passe sous le minimum tactile de 48 dp et fait
  rater des appuis.
- **Le consentement n'est pas pré-coché**, contrairement au prototype. Un
  consentement pré-coché n'en est pas un — à confirmer avec le juriste.
- **Pas de pourcentage pendant le calcul de la stratégie.** Dans le prototype,
  le compteur monte de 9 % par tick, sans aucun lien avec un travail réel, et
  les trois messages qui défilent sont indexés dessus. Comme l'API répond en un
  seul appel, il n'y a rien à mesurer : afficher un chiffre reviendrait à
  l'inventer. L'écran garde l'anneau animé et un message stable, plus un
  avertissement réseau au bout de 6 s. Pour rétablir le pourcentage, tout est
  dans `StrategyScreen` et `Loader`.
- **Pas de dégradés.** React Native n'en fait pas sans `expo-linear-gradient`.
  Les cartes utilisent la teinte haute du dégradé du prototype, ce qui suffit.
- **L'anneau de chargement n'utilise ni `react-native-svg` ni `reanimated`** :
  une bordure dont un seul côté est coloré donne le même arc, et l'`Animated`
  natif de React Native suffit pour la rotation. Les deux animations tournent
  sur le fil natif, donc elles restent fluides pendant l'appel réseau.

### Piège vérifié : `accessibilityState` est ignoré sur le web

React Native Web ne transmet pas `accessibilityState={{ checked }}` au DOM.
Constaté dans le navigateur : les cases ne portaient que `role` et `aria-label`,
donc un lecteur d'écran annonçait « case à cocher » sans jamais dire si elle
était cochée. Il faut passer les attributs ARIA explicitement — `aria-checked`,
`aria-disabled` — qui fonctionnent aussi sur mobile, React Native les
retraduisant en `accessibilityState`. Corrigé dans `SelectableRow` et `Button` ;
à reproduire sur tout nouveau composant sélectionnable.

### Ce qui reste à vérifier ailleurs

Tout ce qui précède a été éprouvé dans le navigateur et contre l'API réelle.
Trois choses ne peuvent pas l'être depuis un poste de développement :

- **La dictée sur Android** — le moteur natif diffère de celui du navigateur,
  et `PREFER_ON_DEVICE` attend un test terrain.
- **Le comportement sur réseau 2G/3G réel** — les coupures ont été simulées en
  détournant les requêtes, ce qui reproduit la panne franche mais pas la
  lenteur ni les pertes partielles.
- **Le rendu sur petit écran Android** — la mise en page mobile n'a été vue que
  dans une fenêtre de navigateur étroite.

Deux limites connues, laissées telles quelles :

- La colonne latérale du chat (web) ne rafraîchit pas son aperçu après l'envoi
  d'un message : elle est chargée une fois à l'ouverture de l'écran.
- L'écran de suivi n'a pas de point d'entrée quand aucune commande n'existe —
  c'est cohérent (il n'y a rien à suivre), mais son état vide ne se voit alors
  qu'après la disparition d'une commande.

### Suivi : la liste, faute de route par identifiant

`FRONTEND_SPEC` §6.10 appelle `GET /api/orders/:id`. Cette route **n'existe
pas** — le module `orders` n'a qu'un `GET /` et un `PATCH /:ref`. L'écran lit
donc la liste, que le serveur restreint déjà aux commandes du client. Aucune
perte : un client en a peu, et cela évite un appel par commande.

`components/tracking/OrderProgress.tsx` est partagé entre le suivi et l'écran
de paiement — ce dernier en affiche une version resserrée quand une commande
existe, avec un bouton « Suivre l'avancement ».

Chaque étape porte son explication en clair (« Vos visuels sont en cours de
création. ») plutôt que le seul nom d'état : `EN_PRODUCTION` ne dit rien à
quelqu'un qui attend son logo.

### Bibliothèque : ni vignette, ni date, ni badge

`FRONTEND_SPEC` §6.9 décrit des cartes « image + titre + date + badge statut
(livré / en cours) ». Le modèle `Template` ne contient que `name`, `meta` et
`state` — pas d'image, et la route ne renvoie même pas la date. Le prototype
affiche d'ailleurs le même cadre rayé marqué « visuel modèle à intégrer » : les
aperçus restent à produire, côté design comme côté backend.

Le badge n'a pas lieu d'être non plus : le serveur ne renvoie à un client que
les modèles `PUBLIE`, donc l'état vaudrait toujours la même chose. (Vérifié :
sur 6 modèles en base, les 2 brouillons n'arrivent pas jusqu'à l'app.)

Attention au malentendu : `Template` est le **catalogue de modèles proposés**,
pas les visuels livrés à l'utilisateur. Le §6.9 parle de « visuels livrés » ;
c'est la commande (`Order`) qui porte cette notion, pas le modèle.

**Les filtres sont déduits des données**, pas codés en dur. Ceux du prototype
(Couture, Transport) n'existent pas en base, qui contient Vente, Restauration,
Services, Commerce et Tous — une liste figée afficherait des filtres qui ne
ramènent rien. La catégorie `Tous` est affichée « Tous métiers » pour ne pas se
confondre avec le filtre « Tout voir » posé juste à côté.

**Ce que fait le bouton « + ».** Aucune route ne permet de « prendre » un
modèle, et la production passe de toute façon par l'équipe. Toucher une carte
ouvre donc la discussion avec un message **pré-rempli mais non envoyé** :
« Bonjour, je voudrais le modèle « … ». » L'utilisateur relit, corrige, décide.
C'est une interprétation du « + » décoratif du prototype — sans elle, l'écran
ne serait qu'une vitrine sans action.

### Paiement : T-Money/Flooz sont réels, la commande reste créée à la main

`FRONTEND_SPEC` §6.7 fait appeler `POST /api/orders`. **Cette route n'existe
toujours pas côté client.** Le module `orders` du backend n'expose qu'un
`GET /` (lecture) et un `PATCH /:ref` réservés au backoffice ; `POST /` crée
bien une commande mais reste réservé au niveau 2 (staff). `Order.state` vaut
`PAYE` par défaut : une commande n'existe qu'une fois le paiement confirmé,
et cette confirmation reste un geste humain, pas automatique.

C'est un choix assumé, pas une limite technique : PayGate Global (agrégateur
T-Money/Flooz togolais) est bien intégré côté backend (`POST /api/payments`),
mais son webhook ne pouvant pas être authentifié de façon fiable, on ne le
laisse jamais créer de commande tout seul. Un paiement `REUSSI` reste donc une
`PaymentRequest` indépendante ; c'est toujours l'équipe qui ouvre la commande
dans le backoffice une fois le paiement vu.

Concrètement, sur cet écran :

- **T-Money et Flooz** déclenchent un vrai prompt de paiement PayGate sur le
  numéro saisi (`POST /api/payments`), puis l'écran sonde `GET
  /api/payments/:identifier` toutes les 3 s jusqu'à un statut définitif
  (`REUSSI`, `ECHEC`, `EXPIRE` ou `ANNULE`). Le montant part réellement du
  compte Mobile Money du client.
- **Espèces au bureau** reste un canal entièrement manuel, comme avant.

**Le flux simulé du prototype n'a jamais été repris.** Il affichait une barre
de progression, « Connexion à T-Money… », puis « reçu n° 4821-KL » sans rien
débiter. Ici, à l'inverse, le statut affiché est celui que PayGate renvoie
réellement — jamais un état inventé côté app.

Dès qu'une commande existe côté serveur (ouverte par le staff), le même écran
affiche son avancement à la place de ce formulaire.

Les prix sont **figés dans `constants/offers.ts`** : le backend n'expose ni
catalogue ni grille tarifaire. Changer un prix demande donc une nouvelle version
de l'app — à déplacer côté serveur si les tarifs doivent bouger sans publier.

Le comparatif Gratuit / Pro ajoute des **en-têtes de colonnes**, absents du
prototype : sur un écran large, les deux cartes s'éloignent du tableau et plus
rien n'indique quelle coche appartient à quelle offre.

### Vocal : dictée, pas enregistrement

La parole devient du **texte**, qui remplit le champ de réponse ou le message.
Rien n'est stocké en audio — ce n'est pas un manque, c'est le choix qui permet
au vocal de fonctionner sans toucher au backend : `Message` n'a qu'un champ
`text`, et aucune route n'accepte de fichier.

| Morceau | Comment |
|---|---|
| Parler pour répondre | `expo-speech-recognition`, `hooks/useDictation.ts` |
| Lire les textes à voix haute | `expo-speech`, `hooks/useSpeech.ts` |

**⚠️ Expo Go ne fonctionne plus.** `expo-speech-recognition` est un module
natif : il faut des builds de développement (`npx expo run:android`). C'est la
contrepartie du vocal, et elle est définitive.

**`expo-av` n'existe pas en SDK 57** — il a été scindé en `expo-audio` et
`expo-video`. `expo-audio` a été installé puis retiré : la reconnaissance
capture elle-même le micro, garder les deux les aurait fait se le disputer.

Deux réglages qui comptent, dans `useDictation.ts` :

- **`continuous: true`** — sinon la reconnaissance s'arrête au premier silence.
  Une personne qui cherche ses mots fait des pauses.
- **`interimResults: true`** — le texte apparaît pendant qu'on parle. C'est le
  seul retour qui montre que ça marche à quelqu'un qui ne relira pas.
- **`PREFER_ON_DEVICE = false`** — le moteur en ligne est plus fiable partout,
  mais il consomme du forfait. Le moteur embarqué d'Android est gratuit et
  fonctionne hors ligne **si** le pack de langue français est installé. À
  basculer dès qu'un test sur un téléphone togolais réel le confirme.

La dictée **complète** ce qui est déjà écrit au lieu de l'effacer : on peut
taper un mot, dicter la suite, s'arrêter, reprendre.

**Pas de dictée sur les questions à choix.** Il faudrait rapprocher une phrase
dictée d'un libellé exact, or ces libellés pilotent le calcul de la stratégie
au caractère près. « Écouter la question » puis toucher son choix est plus sûr
et tout aussi accessible.

**La transcription simulée du prototype n'a pas été reprise.** Le spec prévoit
d'insérer un texte tout fait (le champ `tr` des questions) à l'arrêt de
l'enregistrement. Ces huit réponses produisent la stratégie de marque de la
personne : y mettre une phrase écrite d'avance lui fabriquerait une identité
fondée sur des mots qu'elle n'a jamais prononcés. La dictée réelle rend ce
raccourci inutile.

Reste hors de portée : les **pièces jointes** du composeur (trombone, appareil
photo), qui demandent un stockage de fichiers côté backend.

### Chat : `from: "client"`, pas `from: "assistant"`

`POST /api/conversations/:id/messages` accepte les deux. Avec `assistant`, le
serveur demande au modèle de répondre séance tenante. L'app envoie `client`,
donc le message part au backoffice et un humain répond. Trois raisons :

1. `ANTHROPIC_API_KEY` est absente en développement — la route répond alors 503
   `assistant_unavailable`.
2. Le backend note que ce chemin **n'a jamais été testé** contre l'API réelle.
3. L'écran de mise en relation promet « une première proposition sous 48 h »,
   c'est-à-dire une réponse humaine.

Basculer sur l'assistant IA se fait en changeant ce seul champ dans
`api/conversations.ts`.

Conséquence : rien ne déclenche d'indicateur « en train d'écrire », donc le
composant `TypingIndicator` du §6.6 n'a pas été écrit. Il ira avec le chemin IA.

### Chat : ce que le WebSocket garantit (vérifié)

Un test de bout en bout (`fetch` + `WebSocket` natifs de Node, sans dépendance)
a confirmé onze points du contrat, dont deux qui ont dicté la conception :

- **Un token invalide n'ouvre jamais le socket** (401 pendant la poignée de
  main). Inutile de gérer ce cas à part : la première requête REST de l'écran
  déclenchera la déconnexion.
- **Le client ne reçoit pas son propre message en écho** — le serveur ne le
  diffuse qu'au backoffice. Aucun dédoublonnage n'est donc nécessaire.

### File d'attente hors ligne

Chaque message est écrit sur l'appareil **avant** la tentative réseau, avec son
heure de rédaction. Le serveur accepte cet horodatage (`sentAt`) s'il est
plausible, si bien qu'un message écrit hors ligne garde l'heure où il a été
tapé, pas celle où il est arrivé. Vérifié : deux messages écrits réseau coupé
sont repartis dans l'ordre 2,6 s après le rétablissement.

Le vidage est déclenché par la reconnexion du WebSocket, par l'ouverture de
l'écran, et par une reprise toutes les 15 s tant qu'il reste quelque chose —
ce dernier filet couvre le cas où le socket tient alors que les requêtes HTTP
échouent.

`sending` et `queued` s'affichent tous deux « en attente ». Les distinguer
laisserait « envoi… » à l'écran jusqu'à 48 s sur réseau coupé, le temps que les
réessais s'épuisent.

### Mise en relation : le fil s'ouvre à l'affichage, pas au clic

`FRONTEND_SPEC` §6.5 fait créer la conversation au clic sur « Ouvrir la
discussion ». Elle est créée au montage de l'écran, pour trois raisons :

1. Le backend documente cet appel comme automatique après la stratégie.
2. La route est **idempotente** (verrou consultatif Postgres) : rien n'oblige à
   se protéger d'un double appel. Vérifié en test — deux passages sur l'écran
   ne produisent qu'une conversation.
3. C'est le seul signal fiable de connexion dont dispose l'écran, et il
   alimente la pastille de présence sans ajouter de dépendance réseau.

Le clic reste capable de créer le fil si l'appel du montage a échoué.

### Heures d'ouverture de l'assistance

`SUPPORT_OPENS_AT = 8` dans `components/relation/AssistantCard.tsx`. Le
prototype dit seulement « indisponible avant 8h » et ne mentionne aucune heure
de fermeture — on n'en a donc pas inventé. Si le support s'arrête le soir,
ajouter la borne haute à cet endroit.

### Délai d'attente : deux régimes

Le §10 demande 15 s de délai *et* 2 réessais. Les deux réglages sont bons pris
séparément ; c'est leur cumul qui pose problème :

```
essai 1 (15 s) + attente 1 s + essai 2 (15 s) + attente 2 s + essai 3 (15 s) = 48 s au pire
```

Mesuré : **près de 40 s** avant qu'une coupure réseau soit signalée. Sur la mise
en relation, c'était pire qu'une lenteur — la pastille affichait « En ligne »
pendant tout ce temps, donc l'écran mentait.

D'où deux régimes, portés par `noRetry` et `PROBE_TIMEOUT_MS` dans `client.ts` :

| Régime | Réglage | Pour quoi |
|---|---|---|
| **Sonde** | 8 s, aucun réessai | Appels automatiques dont le résultat s'affiche (présence). Verdict rapide, quitte à être corrigé. |
| **Normal** | 15 s + 2 réessais | Tout le reste, et les actions déclenchées par un bouton : l'utilisateur a choisi d'attendre. |

Après correction, le basculement en « Hors ligne » est mesuré à **2 s** sur une
connexion refusée (8 s au plafond si le réseau pend sans répondre).

Reste ouvert pour les écrans à venir : les appels de fond gardent le cumul de
48 s au pire. Acceptable quand personne ne regarde, à revoir si un écran se met
à en dépendre.

### Points laissés ouverts

- `expo-av` **n'existe plus en SDK 57**. Le vocal (étape 8) devra utiliser
  `expo-audio`. Pour la lecture à voix haute du consentement, `expo-speech`
  ferait de la vraie synthèse hors ligne, ce qui compte pour le public visé.
- Les cases 2 et 3 du consentement (contact assistant, conseils par SMS) n'ont
  aucune route côté backend : elles restent sur l'appareil.
- Le bouton « Continuer avec Gmail » est désactivé — aucune route OAuth
  n'existe. Il est visible mais inactif plutôt que trompeur.
- La police de marque n'est pas chargée (`Fonts.family` vaut `undefined`) : la
  licence Hanken Grotesk reste introuvable et « Start Shift Sans » n'a pas été
  fournie. L'app utilise la police système.

## Organisation

```
src/
├── api/          client axios, routes auth et diagnostic
├── components/   ui/ (génériques) et diagnostic/ (spécifiques)
├── constants/    les 8 questions — libellés critiques
├── hooks/        usePlatform (mobile / web large)
├── navigation/   RootNavigator + types de routes
├── screens/      auth/ et écrans applicatifs
├── store/        Zustand : authStore, diagStore
└── theme/        jetons de design
```

## Réseau instable

Contraintes du §10 déjà en place :

- délai d'attente de 15 s sur tous les appels ;
- deux réessais automatiques, **uniquement** sur erreur réseau (jamais sur une
  réponse 4xx ou 5xx) — sans danger ici, toutes les routes d'écriture de cette
  API étant idempotentes ;
- chaque réponse du diagnostic est écrite sur l'appareil avant d'être envoyée,
  et l'écran affiche « Sur l'appareil » plutôt qu'une erreur quand le serveur
  ne répond pas ;
- au retour dans l'app, la version la plus avancée entre l'appareil et le
  serveur l'emporte, pour ne jamais écraser une saisie faite hors ligne.
