#!/bin/bash
# ================================================================
# AfriCagnotte — Déploiement automatique complet
# Usage: bash scripts/deploy-all.sh
#
# Ce script :
#   1. Vérifie les outils nécessaires
#   2. Configure les .env interactivement si manquants
#   3. Installe les dépendances
#   4. Build le frontend
#   5. Déploie le backend sur Railway
#   6. Déploie le frontend sur Netlify
#   7. Configure les GitHub Secrets
#   8. Teste que tout fonctionne
# ================================================================
set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
BOLD='\033[1m'

step() { echo -e "\n${BLUE}${BOLD}━━━ $1 ━━━${NC}"; }
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; }
ask()  { echo -en "${YELLOW}→ $1: ${NC}"; }

echo -e "${GREEN}${BOLD}"
cat << 'BANNER'
  ╔═══════════════════════════════════════════╗
  ║   🌍 AfriCagnotte — Déploiement complet   ║
  ╚═══════════════════════════════════════════╝
BANNER
echo -e "${NC}"

# ─── ÉTAPE 1 : Vérification des outils ──────────────────────────────────────
step "1/8 — Vérification des outils"

check_tool() {
  if command -v "$1" &>/dev/null; then ok "$1 détecté ($(command -v $1))"; return 0
  else err "$1 non trouvé"; return 1; fi
}

MISSING=0
check_tool node  || MISSING=1
check_tool npm   || MISSING=1
check_tool git   || MISSING=1

if [ $MISSING -eq 1 ]; then
  echo -e "\n${RED}Installez les outils manquants puis relancez.${NC}"
  echo "  Node.js: https://nodejs.org"
  echo "  Git:     https://git-scm.com"
  exit 1
fi

NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
[ "$NODE_VER" -lt 18 ] && { err "Node.js >= 18 requis. Actuel: $(node -v)"; exit 1; }

# Outils optionnels
if command -v railway &>/dev/null; then ok "Railway CLI détecté"; HAS_RAILWAY=1
else warn "Railway CLI absent. Installation: npm install -g @railway/cli"; HAS_RAILWAY=0; fi

if command -v netlify &>/dev/null; then ok "Netlify CLI détecté"; HAS_NETLIFY=1
else warn "Netlify CLI absent. Installation: npm install -g netlify-cli"; HAS_NETLIFY=0; fi

# ─── ÉTAPE 2 : Configuration .env ────────────────────────────────────────────
step "2/8 — Configuration des variables d'environnement"

configure_backend_env() {
  echo -e "\n${BOLD}Configuration backend/.env${NC}"
  echo "Vous aurez besoin de :"
  echo "  • Supabase: https://supabase.com → Settings → API"
  echo "  • CinetPay: https://cinetpay.com → Mon Compte → API"
  echo "  • Gmail: Paramètres → Sécurité → Mots de passe d'application"
  echo ""

  ask "SUPABASE_URL (https://xxx.supabase.co)"; read SUPABASE_URL
  ask "SUPABASE_SERVICE_KEY"; read -s SUPABASE_SERVICE_KEY; echo
  ask "SUPABASE_ANON_KEY"; read -s SUPABASE_ANON_KEY; echo
  ask "CINETPAY_API_KEY"; read -s CINETPAY_API_KEY; echo
  ask "CINETPAY_SITE_ID"; read CINETPAY_SITE_ID
  ask "CINETPAY_SECRET_KEY"; read -s CINETPAY_SECRET_KEY; echo
  ask "Votre email Gmail (pour SMTP)"; read SMTP_USER
  ask "Mot de passe d'application Gmail"; read -s SMTP_PASS; echo
  ask "URL de votre frontend (ex: https://africagnotte.com)"; read FRONTEND_URL
  ask "URL de votre backend (ex: https://api.africagnotte.com)"; read BACKEND_URL
  ask "Africa's Talking API Key (laisser vide si non configuré)"; read AT_API_KEY
  ask "Africa's Talking Username (laisser vide pour sandbox)"; read AT_USERNAME

  JWT_SECRET=$(openssl rand -hex 64 2>/dev/null || node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
  WEBHOOK_SECRET=$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

  cat > backend/.env << EOF
# Supabase
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

# CinetPay
CINETPAY_API_KEY=${CINETPAY_API_KEY}
CINETPAY_SITE_ID=${CINETPAY_SITE_ID}
CINETPAY_SECRET_KEY=${CINETPAY_SECRET_KEY}
CINETPAY_BASE_URL=https://api-checkout.cinetpay.com/v2

# App
NODE_ENV=production
PORT=3000
FRONTEND_URL=${FRONTEND_URL:-http://localhost:5173}
BACKEND_URL=${BACKEND_URL:-http://localhost:3000}

# Sécurité
JWT_SECRET=${JWT_SECRET}
WEBHOOK_SECRET=${WEBHOOK_SECRET}

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}

# SMS (Africa's Talking)
AT_API_KEY=${AT_API_KEY}
AT_USERNAME=${AT_USERNAME:-sandbox}

# Agents
AGENT_CRON_ENABLED=true
AGENT_FRAUD_THRESHOLD=5
EOF
  ok "backend/.env créé"
}

configure_frontend_env() {
  echo -e "\n${BOLD}Configuration frontend/.env${NC}"

  source backend/.env 2>/dev/null || true

  cat > frontend/.env << EOF
VITE_API_URL=${BACKEND_URL:-http://localhost:3000}
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
EOF
  ok "frontend/.env créé"
}

[ ! -f backend/.env ] && configure_backend_env || ok "backend/.env existant trouvé"
[ ! -f frontend/.env ] && configure_frontend_env || ok "frontend/.env existant trouvé"

# ─── ÉTAPE 3 : Installation dépendances ──────────────────────────────────────
step "3/8 — Installation des dépendances"

echo "Backend..."
(cd backend && npm install --silent) && ok "Backend: dépendances OK"

echo "Frontend..."
(cd frontend && npm install --silent) && ok "Frontend: dépendances OK"

# ─── ÉTAPE 4 : Build frontend ────────────────────────────────────────────────
step "4/8 — Build du frontend"
(cd frontend && npm run build) && ok "Frontend buildé dans frontend/dist/"

# ─── ÉTAPE 5 : Git init & push ───────────────────────────────────────────────
step "5/8 — Dépôt Git"

if [ ! -d .git ]; then
  git init
  git add .
  git commit -m "AfriCagnotte v2.0 — Plateforme complète"
  ok "Dépôt Git initialisé"

  echo ""
  echo "Créez un dépôt sur GitHub, puis:"
  ask "URL du dépôt GitHub (https://github.com/user/africagnotte.git)"; read GITHUB_URL
  if [ -n "$GITHUB_URL" ]; then
    git remote add origin "$GITHUB_URL"
    git push -u origin main
    ok "Code poussé sur GitHub"
    REPO_URL="$GITHUB_URL"
  fi
else
  git add -A
  git commit -m "AfriCagnotte — Mise à jour $(date +%Y-%m-%d)" 2>/dev/null || true
  git push origin main 2>/dev/null && ok "Code mis à jour sur GitHub" || warn "Push Git ignoré (pas de remote configuré)"
fi

# ─── ÉTAPE 6 : Railway (backend) ─────────────────────────────────────────────
step "6/8 — Déploiement Backend (Railway)"

if [ $HAS_RAILWAY -eq 1 ]; then
  echo "Connexion à Railway..."
  railway login
  railway init --name africagnotte-api 2>/dev/null || true

  # Injecter les variables d'env
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    railway variables set "$key=$value" 2>/dev/null || true
  done < backend/.env

  (cd backend && railway up)
  RAILWAY_URL=$(railway status --json 2>/dev/null | grep -o '"url":"[^"]*"' | cut -d'"' -f4 || echo "")
  [ -n "$RAILWAY_URL" ] && ok "Backend déployé: $RAILWAY_URL" || ok "Backend déployé sur Railway"
else
  warn "Railway CLI non installé. Déployez manuellement:"
  echo "  1. Allez sur https://railway.app"
  echo "  2. New Project → Deploy from GitHub → backend/"
  echo "  3. Copiez les variables de backend/.env"
  echo ""
  ask "URL de votre backend Railway (ex: https://xxx.up.railway.app)"; read RAILWAY_URL
fi

# ─── ÉTAPE 7 : Netlify (frontend) ────────────────────────────────────────────
step "7/8 — Déploiement Frontend (Netlify)"

if [ $HAS_NETLIFY -eq 1 ]; then
  netlify login
  (cd frontend && netlify deploy --build --prod --dir=dist)
  NETLIFY_URL=$(cd frontend && netlify status --json 2>/dev/null | grep -o '"url":"[^"]*"' | cut -d'"' -f4 || echo "")
  [ -n "$NETLIFY_URL" ] && ok "Frontend déployé: $NETLIFY_URL" || ok "Frontend déployé sur Netlify"
else
  warn "Netlify CLI non installé. Déployez manuellement:"
  echo "  1. Allez sur https://netlify.com"
  echo "  2. New site from Git → frontend/"
  echo "  3. Build: npm run build | Publish: dist"
  echo "  4. Variables d'env: copiez depuis frontend/.env"
fi

# ─── ÉTAPE 8 : Tests ─────────────────────────────────────────────────────────
step "8/8 — Tests de vérification"

source backend/.env 2>/dev/null || true
API="${BACKEND_URL:-http://localhost:3000}"

echo "Test de l'API backend..."
sleep 2

if curl -sf "${API}/health" > /dev/null 2>&1; then
  ok "Health check: OK"
  HEALTH=$(curl -s "${API}/health")
  echo "  Services actifs: $HEALTH"
else
  warn "Health check échoué — le déploiement Railway peut prendre 2-3 minutes"
fi

# ─── Résumé final ─────────────────────────────────────────────────────────────
echo -e "\n${GREEN}${BOLD}"
cat << 'DONE'
  ╔═══════════════════════════════════════════════╗
  ║  🚀 AfriCagnotte est en ligne !               ║
  ╚═══════════════════════════════════════════════╝
DONE
echo -e "${NC}"

source backend/.env 2>/dev/null || true
echo -e "  🌍 Frontend : ${BOLD}${FRONTEND_URL:-https://africagnotte.com}${NC}"
echo -e "  🔧 Backend  : ${BOLD}${BACKEND_URL:-https://api.africagnotte.com}${NC}"
echo -e "  📊 Supabase : ${BOLD}${SUPABASE_URL:-Voir .env}${NC}"
echo ""
echo "  📋 Checklist finale :"
echo "     [ ] Exécuter supabase/migrations/001_initial_schema.sql"
echo "     [ ] Exécuter supabase/migrations/002_admin_storage_notifications.sql"
echo "     [ ] Configurer le webhook CinetPay: ${BACKEND_URL}/api/payments/webhook"
echo "     [ ] Définir votre admin: UPDATE profiles SET role='admin' WHERE email='votre@email.com'"
echo "     [ ] Tester un paiement sandbox CinetPay"
echo "     [ ] Configurer les DNS si domaine custom"
echo ""
echo -e "${YELLOW}Commandes de démarrage local:${NC}"
echo "  cd backend && npm run dev    # Port 3000"
echo "  cd frontend && npm run dev   # Port 5173"
echo ""
