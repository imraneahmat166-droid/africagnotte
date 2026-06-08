# 🌍 AfriCagnotte — Guide de mise en ligne complète

## Architecture

```
africagnotte/
├── backend/          ← Node.js + Express + CinetPay
├── frontend/         ← React + Vite + React Router
├── supabase/         ← Schéma SQL + migrations
├── deploy/           ← Configs Netlify
└── .github/          ← CI/CD GitHub Actions
```

---

## ÉTAPE 1 — Supabase (Base de données)

1. Créer un compte sur https://supabase.com
2. Créer un nouveau projet (choisir région Europe West)
3. Copier votre `Project URL` et vos clés API (`anon` et `service_role`)
4. Aller dans **SQL Editor** → coller et exécuter le contenu de `supabase/migrations/001_initial_schema.sql`
5. Activer l'authentification email/password dans **Authentication → Providers**

---

## ÉTAPE 2 — CinetPay (Paiements)

1. Créer un compte sur https://cinetpay.com
2. Créer un site marchand, récupérer :
   - `API Key`
   - `Site ID`
   - `Secret Key`
3. Configurer l'URL de notification (webhook) :
   ```
   https://api.africagnotte.com/api/payments/webhook
   ```
4. Configurer l'URL de retour :
   ```
   https://africagnotte.com/payment/success
   ```

---

## ÉTAPE 3 — Backend sur Railway

1. Créer un compte sur https://railway.app
2. Connecter votre dépôt GitHub
3. Créer un nouveau service → choisir le dossier `backend`
4. Ajouter les variables d'environnement (copier depuis `.env.example`) :

```
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
SUPABASE_ANON_KEY=...
CINETPAY_API_KEY=...
CINETPAY_SITE_ID=...
CINETPAY_SECRET_KEY=...
CINETPAY_BASE_URL=https://api-checkout.cinetpay.com/v2
NODE_ENV=production
FRONTEND_URL=https://africagnotte.com
BACKEND_URL=https://api.africagnotte.com
JWT_SECRET=<générer avec: openssl rand -hex 64>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre@gmail.com
SMTP_PASS=<mot de passe d'application Gmail>
AGENT_CRON_ENABLED=true
```

5. Railway génère automatiquement un domaine : copier l'URL → sera votre `BACKEND_URL`
6. Configurer un domaine custom : `api.africagnotte.com` → pointer vers Railway

---

## ÉTAPE 4 — Frontend sur Netlify

1. Créer un compte sur https://netlify.com
2. Connecter votre dépôt GitHub
3. Configuration de build :
   - **Base directory** : `frontend`
   - **Build command** : `npm run build`
   - **Publish directory** : `frontend/dist`
4. Variables d'environnement :
```
VITE_API_URL=https://api.africagnotte.com
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
5. Copier `deploy/netlify.toml` à la racine du dépôt
6. Configurer domaine custom : `africagnotte.com` → pointer vers Netlify

---

## ÉTAPE 5 — GitHub Secrets (CI/CD)

Aller dans Settings → Secrets and variables → Actions :

```
RAILWAY_TOKEN          ← Token API Railway
NETLIFY_AUTH_TOKEN     ← Token API Netlify
NETLIFY_SITE_ID        ← ID de votre site Netlify
VITE_API_URL           ← https://api.africagnotte.com
VITE_SUPABASE_URL      ← https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY ← clé anon Supabase
```

---

## ÉTAPE 6 — DNS (domaines)

Chez votre registrar (Gandi, OVH, Namecheap...) :

```
africagnotte.com        CNAME → votre-site.netlify.app
api.africagnotte.com    CNAME → votre-service.railway.app
```

---

## ÉTAPE 7 — Tests avant mise en ligne

```bash
# Test API locale
cd backend && npm install && npm run dev

# Test frontend local
cd frontend && npm install && npm run dev

# Tester le webhook CinetPay avec ngrok
npx ngrok http 3000
# Copier l'URL ngrok dans CinetPay comme notify_url temporaire
```

---

## Agents automatisés actifs

| Agent           | Fréquence       | Rôle                                       |
|-----------------|-----------------|---------------------------------------------|
| Expiration      | Toutes les 1h   | Expire les cagnottes dont la date est passée |
| Rappel          | Chaque jour 9h  | Emails J-7, J-3, J-1 avant fin              |
| Fraude          | Toutes les 30mn | Détecte dons suspects                        |
| Stats           | Toutes les 15mn | Met à jour les statistiques globales         |
| Nettoyage       | Chaque jour 2h  | Purge les transactions obsolètes            |
| Réconciliation  | Toutes les 2h   | Vérifie les paiements pending trop longs    |

---

## Commandes utiles

```bash
# Démarrer le backend en production
cd backend && npm start

# Lancer les agents manuellement (debug)
cd backend && npm run agents

# Build frontend
cd frontend && npm run build
```

---

## Support CinetPay

- Documentation : https://cinetpay.com/documentation
- Test en sandbox : utiliser les numéros de test fournis par CinetPay
- Support : support@cinetpay.com

---

## Checklist finale avant lancement

- [ ] Schéma SQL exécuté dans Supabase
- [ ] Variables d'environnement configurées sur Railway
- [ ] Webhook CinetPay configuré avec l'URL de production
- [ ] DNS configurés et propagés (24-48h)
- [ ] Test d'un paiement complet en sandbox
- [ ] Email de confirmation reçu
- [ ] Dashboard mis à jour après le don
- [ ] Agents actifs (vérifier `/api/agents/status`)
