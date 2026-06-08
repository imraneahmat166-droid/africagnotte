#!/bin/bash
# ============================================================
# AfriCagnotte — Script de setup automatique
# Usage: bash setup.sh
# ============================================================
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}"
echo "  🌍 AfriCagnotte — Setup automatique"
echo "============================================"
echo -e "${NC}"

# 1. Vérifications
echo -e "${YELLOW}[1/6] Vérification des prérequis...${NC}"
command -v node >/dev/null 2>&1 || { echo -e "${RED}❌ Node.js requis (https://nodejs.org)${NC}"; exit 1; }
command -v npm  >/dev/null 2>&1 || { echo -e "${RED}❌ npm requis${NC}"; exit 1; }
node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt 18 ]; then
  echo -e "${RED}❌ Node.js >= 18 requis (version actuelle: $(node -v))${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v) détecté${NC}"

# 2. Variables d'environnement
echo -e "${YELLOW}[2/6] Configuration des variables d'environnement...${NC}"
if [ ! -f "backend/.env" ]; then
  cp backend/.env.example backend/.env
  echo -e "${YELLOW}⚠️  Fichier backend/.env créé. Remplissez les valeurs avant de continuer.${NC}"
  echo "   → SUPABASE_URL, SUPABASE_SERVICE_KEY"
  echo "   → CINETPAY_API_KEY, CINETPAY_SITE_ID"
  echo "   → JWT_SECRET (générer avec: openssl rand -hex 64)"
  read -p "Appuyez sur Entrée une fois le .env configuré..."
fi
if [ ! -f "frontend/.env" ]; then
  cp frontend/.env.example frontend/.env
  echo -e "${YELLOW}⚠️  Fichier frontend/.env créé. Remplissez VITE_API_URL et VITE_SUPABASE_URL.${NC}"
  read -p "Appuyez sur Entrée une fois le .env configuré..."
fi
echo -e "${GREEN}✅ Variables d'environnement configurées${NC}"

# 3. Installation dépendances
echo -e "${YELLOW}[3/6] Installation des dépendances...${NC}"
cd backend && npm install --silent
echo -e "${GREEN}✅ Backend: dépendances installées${NC}"
cd ../frontend && npm install --silent
echo -e "${GREEN}✅ Frontend: dépendances installées${NC}"
cd ..

# 4. Test connexion backend
echo -e "${YELLOW}[4/6] Test de démarrage backend...${NC}"
cd backend
timeout 5 node -e "require('./src/lib/supabase')" 2>/dev/null && echo -e "${GREEN}✅ Supabase client OK${NC}" || echo -e "${YELLOW}⚠️  Vérifiez vos clés Supabase dans .env${NC}"
cd ..

# 5. Build frontend
echo -e "${YELLOW}[5/6] Build du frontend...${NC}"
cd frontend && npm run build --silent
echo -e "${GREEN}✅ Frontend buildé dans frontend/dist/${NC}"
cd ..

# 6. Résumé
echo ""
echo -e "${GREEN}============================================"
echo "  ✅ Setup terminé !"
echo "============================================${NC}"
echo ""
echo -e "Pour lancer en développement:"
echo -e "  ${YELLOW}cd backend && npm run dev${NC}        (port 3000)"
echo -e "  ${YELLOW}cd frontend && npm run dev${NC}       (port 5173)"
echo ""
echo -e "Pour déployer en production:"
echo -e "  ${YELLOW}git push origin main${NC}              (déploiement auto CI/CD)"
echo ""
echo -e "Checklist déploiement:"
echo "  [ ] Schéma SQL exécuté dans Supabase"
echo "  [ ] Webhook CinetPay configuré"
echo "  [ ] DNS propagés (24-48h)"
echo "  [ ] GitHub Secrets configurés"
echo ""
