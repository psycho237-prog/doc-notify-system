# NNLOMNE Notify — Notifications SMS de masse

Application **mobile-first** de notifications SMS : l'administrateur saisit les **noms** et **numéros de téléphone** de ses destinataires ainsi que le **motif** de la notification (ex. « votre document est disponible »). Un **seul message** est rédigé, puis **personnalisé automatiquement avec le nom de chaque destinataire** (`{name}`) avant envoi via l'API **MboaSMS**.

Chaque SMS est **nettoyé automatiquement** : accents, emojis, guillemets typographiques, accolades et tout caractère spécial sont supprimés ou convertis — le message final ne contient **aucun caractère spécial**.

---

## 🚀 Démarrage rapide

```bash
cd frontend
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

**Connexion (mode démo, sans configuration) :**

| Champ | Valeur |
| --- | --- |
| E-mail | `admin@nnlomne.gov` |
| Mot de passe | `password` |

Dès la première connexion, 6 contacts de démonstration sont créés (modifiables/supprimables dans l'onglet **Contacts**).

---

## 🧠 Mode hybride : démo locale vs Firebase

L'application fonctionne dans deux modes, choisis **automatiquement** :

- **Mode local (démo)** — par défaut, aucune configuration requise.
- **Mode Firebase** — dès qu'une vraie clé API Firebase est présente.

### Comment le mode est-il choisi ?

| Condition | Mode actif |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` non définie **ou** contient `DUMMY` | **Local (démo)** |
| `NEXT_PUBLIC_FIREBASE_API_KEY` définie avec une vraie clé | **Firebase** |

> La clé par défaut du code source (`AIzaSyDUMMY-SAFE-FOR-BUILD`) est volontairement factice : elle force le mode local tant qu'aucune vraie clé n'est fournie.

### Différences entre les deux modes

| | 🟢 Mode local (démo) | 🔵 Mode Firebase |
| --- | --- | --- |
| Contacts & historique | Stockés dans le **navigateur** (`localStorage`) | Stockés dans **Firestore** (via les routes API) |
| Connexion | Identifiants démo fixes | Auth Firebase réelle (e-mail/mot de passe) |
| Envoi des SMS | **Réel** via MboaSMS (`/api/send-sms`) | Identique |
| Persistance | Par navigateur (perdue si cache effacé) | Multi-appareils, persistante |
| Configuration | Aucune | Variables d'environnement (voir plus bas) |

### Repli automatique

Si une route API Firebase échoue en cours d'utilisation (ex. compte de service manquant), la couche de données (`src/lib/data.ts`) **bascule automatiquement en mode local** pour le reste de la session — l'application ne plante jamais.

### Passer du mode Firebase au mode local

Supprimez (ou mettez à `AIzaSyDUMMY-...`) la variable `NEXT_PUBLIC_FIREBASE_API_KEY`, puis redéployez / relancez le serveur de dev.

---

## 🔑 Variables d'environnement

Créez un fichier `.env.local` à la racine de `frontend/`. Un fichier d'exemple commenté est fourni :

```bash
cp .env.local.example .env.local
```

```env
# ── Envoi SMS (MboaSMS) ───────────────────────────────────────────
MBOASMS_API_KEY=clé_api_mboasms
MBOASMS_SENDER_ID=DocNotify

# ── Mode Firebase (optionnel — requis pour Firestore) ─────────────
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=nnlomne-notify.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=nnlomne-notify
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=nnlomne-notify.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:000000000000
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account", ...}
```

### Détail des variables

| Variable | Mode | Obligatoire | Rôle |
| --- | --- | --- | --- |
| `MBOASMS_API_KEY` | Les deux | Recommandée* | Clé de l'API MboaSMS pour l'envoi réel des SMS |
| `MBOASMS_SENDER_ID` | Les deux | Non | Identifiant expéditeur affiché (défaut : `DocNotify`) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase | Oui | Clé API publique du projet Firebase (déclenche le mode Firebase) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase | Non | Domaine d'authentification (défaut : `nnlomne-notify.firebaseapp.com`) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase | Non | ID du projet (défaut : `nnlomne-notify`) |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase | Non | Bucket de stockage |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase | Non | ID d'expéditeur de messagerie |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase | Non | ID de l'application web |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase | Oui | **JSON complet** du compte de service (utilisé côté serveur par les routes API Firestore) |

\* En mode démo, une clé de secours est présente dans le code pour que l'envoi fonctionne sans configuration. **En production, définissez toujours `MBOASMS_API_KEY` en variable d'environnement** — ne committez jamais une vraie clé.

> 🔒 `NEXT_PUBLIC_*` sont exposées au navigateur (par design). `MBOASMS_API_KEY` et `FIREBASE_SERVICE_ACCOUNT_JSON` restent côté serveur uniquement.

### Déploiement Vercel

Ajoutez ces variables dans **Project → Settings → Environment Variables** (ou via `vercel env add`). Aucune variable n'est nécessaire pour un déploiement en **mode démo**.

---

## 🧪 Tests & validation

```bash
npm test            # tests unitaires (vitest)
npm run typecheck   # vérification TypeScript (tsc --noEmit)
npm run lint        # ESLint
npm run build       # build de production (inclut typecheck + lint)
```

> 🚀 **Validation en un clic** : `validate.bat` (Windows / cmd) ou `validate.sh` (Linux / macOS / Git Bash) exécute les trois étapes dans l'ordre — `npm install` → `npm test` → `npm run build` — et s'arrête à la première erreur.

### Ce que couvrent les tests (`src/lib/*.test.ts`)

- **Sanitisation** : suppression des accents, emojis, guillemets typographiques, accolades… → garantie « aucun caractère spécial » dans le message final.
- **Numéros camerounais** : normalisation `+237`, validation (MTN `67/68`, Orange `65/69`, Camtel `62`).
- **Parsing des listes** : lignes `Nom; 691234567` (séparateurs `;` `,` `|` ou tabulation), détection des lignes invalides.
- **Couche de données locale** : seeding des contacts démo, ajout de contacts, statistiques, nettoyage.

> 💡 Pour tester l'envoi sans dépenser de crédits SMS, activez le **mode simulation** dans l'application (Réglages → Mode simulation) : les SMS sont marqués comme envoyés sans contacter MboaSMS.

---

## 📁 Structure du projet

```text
frontend/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── send-sms/        # Envoi SMS MboaSMS (sanitisé, personnalisé {name})
│   │   │   ├── dashboard/       # Statistiques (mode Firebase)
│   │   │   ├── citizens/        # Contacts (mode Firebase)
│   │   │   └── sms-logs/        # Historique (mode Firebase)
│   │   ├── page.tsx             # Connexion (démo ou Firebase)
│   │   ├── dashboard/           # Accueil (stats + activité récente)
│   │   ├── notifications/       # Composition & envoi (flux principal)
│   │   ├── sms-history/         # Historique des SMS
│   │   ├── records/             # Contacts enregistrés
│   │   └── settings/            # Réglages (simulation, langue, données)
│   ├── components/layout/       # Sidebar (desktop) + MobileNav (barre du bas)
│   ├── lib/
│   │   ├── data.ts              # ⭐ Couche hybride (localStorage ↔ API Firestore)
│   │   ├── phone-utils.ts       # Numéros, parsing, sanitisation
│   │   ├── i18n.ts              # Traductions FR/EN
│   │   ├── types.ts             # Types partagés
│   │   └── seed.ts              # Contacts de démonstration
│   └── test/setup.ts            # Stub localStorage pour les tests
├── vitest.config.ts
└── package.json
```

> Le dossier `backend/functions/` (à la racine du dépôt) est un ancien déploiement Firebase Cloud Functions, indépendant de l'application Vercel. Il n'est pas requis pour faire fonctionner l'application.

---

## 🛠️ Commandes utiles

| Commande | Action |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm test` | Tests unitaires |
| `npm run build` | Build de production |
| `npm run start` | Sert le build de production |
