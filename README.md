# DocNotify — Système de notifications documentaires

Application web **mobile-first** de **notifications SMS de masse** pour les services administratifs : l'administrateur saisit les **noms** et **numéros** de ses destinataires ainsi que le **motif** de la notification (ex. « votre document est disponible »). Un **seul message** est rédigé, puis **personnalisé avec le nom de chaque destinataire** (`{name}`) avant envoi via l'API **MboaSMS**.

Chaque SMS est **nettoyé automatiquement** : accents, emojis et caractères spéciaux sont supprimés du message final.

---

## 🚀 Fonctionnalités

- **Envoi de masse personnalisé** : une seule saisie, un SMS par destinataire avec son nom.
- **Nettoyage des caractères spéciaux** : garantie GSM, aucun caractère spécial dans le message final.
- **Mobile-first** : navigation par onglets en bas sur mobile, sidebar sur desktop.
- **Gestion des contacts** : ajout, suppression, recherche, **sélection multiple** pour notifier, **export CSV**.
- **Historique SMS** : suivi envoyés/échoués, filtres, recherche, export CSV.
- **Mode simulation** : tester l'envoi sans dépenser de crédits SMS.
- **Bilingue FR/EN** avec bascule dans l'application.
- **Mode hybride** : fonctionne **sans aucune configuration** (démo locale) ou avec **Firebase** (données synchronisées dans Firestore).

---

## 🏗️ Architecture

| Couche | Technologie |
| --- | --- |
| **Frontend** (`frontend/`) | **Next.js 14** + TypeScript + Tailwind CSS, déployé sur **Vercel** |
| **Données** | **Mode hybride** : Firestore (via routes API Next.js) si Firebase est configuré, sinon **localStorage** dans le navigateur |
| **Authentification** | **Firebase Auth** (mode Firebase) ou **connexion démo** (`admin@nnlomne.gov` / `password`) |
| **SMS** | **MboaSMS** via la route Next.js `/api/send-sms` (personnalisation `{name}` + sanitisation côté serveur) |
| **Tests** | **Vitest** (tests unitaires sur sanitisation, numéros camerounais, parsing, données) |

```
doc-notify-system/
├── frontend/            # ⭐ Application Next.js (déployée sur Vercel)
│   ├── src/app/         # Pages (Accueil, Envoyer, Historique, Contacts, Réglages) + API routes
│   ├── src/components/  # Sidebar desktop + barre d'onglets mobile
│   ├── src/lib/         # Couche de données hybride, sanitisation, i18n, types, seed
│   ├── src/test/        # Setup vitest (stub localStorage)
│   └── README.md        # 📄 Documentation détaillée de l'application
└── backend/functions/   # Anciens Firebase Cloud Functions (non requis par l'app Vercel)
```

---

## 🚀 Démarrage rapide

```bash
cd frontend
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) et connectez-vous avec les **identifiants démo** :

| Champ | Valeur |
| --- | --- |
| E-mail | `admin@nnlomne.gov` |
| Mot de passe | `password` |

---

## 📄 Documentation détaillée

👉 **Toute la documentation de l'application se trouve dans [`frontend/README.md`](frontend/README.md)** :

- **Mode hybride** : comment le mode démo locale ↔ Firebase est choisi, les différences entre les deux, le repli automatique.
- **Variables d'environnement** : `MBOASMS_API_KEY`, `MBOASMS_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_*` et `FIREBASE_SERVICE_ACCOUNT_JSON` — tableau complet avec rôle et caractère obligatoire.
- **Tests** : `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` et ce que couvrent les tests.
- **Structure du code** : arborescence commentée des dossiers de l'application.

---

## 📄 Licence

MIT

---

*Construit pour une expérience de récupération de documents fluide et sans friction.*
