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

## 🎯 Passer de la démo au mode production

L'application démarre toujours en **mode démo** tant que `NEXT_PUBLIC_FIREBASE_API_KEY` n'est pas une vraie clé. Voici la marche à suivre complète pour un passage en production : **Firebase Auth** (connexion réelle), **Cloud Firestore** (données partagées) et **MboaSMS** (envoi réel).

### Étape 1 — Préparer Firebase

1. Allez sur [console.firebase.google.com](https://console.firebase.google.com) → **Add project** (ou utilisez `nnlomne-notify`).
2. **Firestore Database** → *Create database* → **mode production** et une région proche de vos utilisateurs (ex. `europe-west`).
3. **Authentication** → *Sign-in method* → activez **Email/Password**.
4. **Authentication** → *Users* → *Add user* → créez le compte **administrateur** (e-mail + mot de passe fort). C'est ce couple que vous utiliserez pour vous connecter en production.
5. **Project settings** (⚙️) → *Your apps* → *Add web app* → notez les **6 valeurs** : `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`.

### Étape 2 — Générer le compte de service (clé serveur)

Les routes API (`/api/citizens`, `/api/dashboard`, `/api/sms-logs`, `/api/send-sms`) écrivent dans Firestore via le **SDK Admin** : elles ont besoin du compte de service.

1. **Project settings** → onglet **Comptes de service** → **Générer une nouvelle clé privée** → un fichier `xxx-firebase-adminsdk-xxxxx.json` est téléchargé.
2. Ce fichier est le **JSON complet** à mettre dans `FIREBASE_SERVICE_ACCOUNT_JSON` — **sur une seule ligne** (les retours à la ligne cassent la variable). Astuce : `cat fichier.json | jq -c` (Linux) ou `JSON.stringify(...)` dans la console du navigateur.

> 🔒 Ne committez jamais ce fichier : il est déjà exclu par `.gitignore` (`*firebase-adminsdk*.json`, `*service-account*.json`).

### Étape 3 — Récupérer la clé MboaSMS

1. Connectez-vous au [dashboard MboaSMS](https://mboasms.com) → **API** → copiez la **clé API** et l'**identifiant expéditeur (Sender ID)**.
2. Vérifiez que le compte dispose de **crédits SMS** suffisants.

> ⚠️ Le code contient une **clé de secours en dur** (`src/app/api/send-sms/route.ts`, fallback `mboa_e483...`) qui permet l'envoi en démo sans configuration. Elle est **publique** (visible dans le dépôt) : en production, définissez toujours `MBOASMS_API_KEY` en variable d'environnement, **régénérez la clé** dans le dashboard MboaSMS (elle est compromise), puis retirez le fallback en dur du code.

### Étape 4 — Configurer les variables dans Vercel

**Project → Settings → Environment Variables** (environnement **Production**) :

```env
# ── Firebase (côté navigateur — préfixe NEXT_PUBLIC obligatoire) ──
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...                        # la vraie clé web → active le mode Firebase
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=nnlomne-notify
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=nnlomne-notify.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:000000000000

# ── Firebase (côté serveur uniquement) ───────────────────────────
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...",...}  # une seule ligne

# ── MboaSMS (côté serveur uniquement) ────────────────────────────
MBOASMS_API_KEY=votre_vraie_cle_mboasms
MBOASMS_SENDER_ID=DocNotify
```

Redéployez ensuite (`git push` sur `master` → déploiement automatique, ou bouton **Redeploy** dans Vercel).

### Étape 5 — Créer les index composites Firestore

Les routes utilisent des requêtes combinant `where` + `orderBy` / `count`. La première fois, Firestore renvoie une erreur **500 avec un lien** pour créer l'**index composite** manquant — ouvrez ce lien (ou chargez les pages Accueil / Contacts / Historique) et cliquez **Create index**. Index requis :

| Collection | Requête | Index à créer |
| --- | --- | --- |
| `citizens` | `where(institutionId)` + `orderBy(createdAt desc)` | `institutionId` ↑ + `createdAt` ↓ |
| `sms_logs` | `where(institutionId)` + `orderBy(sentAt desc)` | `institutionId` ↑ + `sentAt` ↓ |
| `sms_logs` | `where(institutionId)` + `where(status)` + `orderBy(sentAt desc)` | `institutionId` ↑ + `status` ↑ + `sentAt` ↓ |
| `sms_logs` | compteurs `where(institutionId)` + `where(status)` + `where(sentAt >= …)` | combinaison des 3 champs |

> Les collections `citizens` et `sms_logs` sont créées automatiquement à la première écriture. Si une route renvoie `500` avec « index » dans le message, c'est ce point.

### Étape 6 — Verrouiller les règles Firestore

L'application ne parle **jamais** directement à Firestore : tout passe par les routes API (SDK Admin, qui contourne les règles). Vous pouvez donc **refuser tout accès client** :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Publiez ces règles dans **Firestore → Rules**.

### Étape 7 — Vérifier que le mode production est actif

| Contrôle | Démo | Production attendue |
| --- | --- | --- |
| Page de connexion | Encadré « Mode démo » + identifiants fixes | Pas d'encadré, connexion e-mail/mot de passe Firebase |
| Réglages → Mode de données | « Démo locale » | « Firebase — données synchronisées dans Firestore » |
| Contact ajouté sur un appareil | — | Visible depuis un autre navigateur |
| Réglages → Mode simulation | À désactiver | **Désactivé** avant tout envoi réel |

> ⚠️ Le réglage **Mode simulation** est stocké **par navigateur** (localStorage). Vérifiez qu'il est bien éteint sur chaque poste d'administration avant d'envoyer de vrais SMS.

### Étape 8 — Checklist de sécurité avant mise en service

- [ ] `MBOASMS_API_KEY` définie dans Vercel et clé MboaSMS **régénérée** (l'ancienne est publique)
- [ ] Fallback en dur retiré de `src/app/api/send-sms/route.ts`
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` présente (sinon les routes renvoient 500)
- [ ] Utilisateur administrateur créé dans Firebase Auth avec mot de passe fort
- [ ] Règles Firestore publiées (accès client refusé)
- [ ] Index composites créés (Accueil, Contacts, Historique sans erreur 500)
- [ ] Mode simulation désactivé
- [ ] **Test réel** réussi avec un petit lot (2–3 numéros) avant la campagne

### Dépannage rapide

| Symptôme | Cause probable | Correctif |
| --- | --- | --- |
| Console : « API unavailable, switching to local mode » | `FIREBASE_SERVICE_ACCOUNT_JSON` absente ou mal formée (retours à la ligne) | Corrigez la variable (une seule ligne) |
| `500` sur `/api/dashboard` avec « index » | Index composite manquant | Créez l'index via le lien dans l'erreur |
| Connexion refusée | Utilisateur absent de Firebase Auth ou provider Email/Password désactivé | Ajoutez l'utilisateur / activez le provider |
| SMS marqués échoués | Clé MboaSMS invalide ou crédits épuisés | Vérifiez la clé et le solde ; testez d'abord en mode simulation |

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
