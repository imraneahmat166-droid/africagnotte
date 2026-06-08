#!/bin/bash
# Test rapide de tous les endpoints API
BASE="${API_URL:-http://localhost:3000}"
GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'

echo "🧪 Test API AfriCagnotte — $BASE"
echo "================================"

check() {
  local desc="$1" url="$2" expected="$3"
  local code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$code" = "$expected" ]; then
    echo -e "${GREEN}✅ $desc ($code)${NC}"
  else
    echo -e "${RED}❌ $desc — attendu $expected, reçu $code${NC}"
  fi
}

check "Health check"              "$BASE/health"                200
check "Campaigns list"            "$BASE/api/campaigns"          200
check "Campaign not found"        "$BASE/api/campaigns/inexistant" 404
check "Auth required (create)"    "$BASE/api/campaigns" 401  # sans token
check "Payment (sans body)"       "$BASE/api/payments/initiate" 400
check "Agents status"             "$BASE/api/agents/status"     200
check "404 route"                 "$BASE/api/inexistant"         404

echo ""
echo "Tests terminés. Vérifiez les ❌ avant de déployer."
