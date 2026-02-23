#!/bin/bash
set -e

# PropWise AI — Deployment Script
# Usage:
#   ./scripts/deploy.sh              Deploy everything (functions + rules + indexes)
#   ./scripts/deploy.sh functions     Deploy only functions
#   ./scripts/deploy.sh firestore     Deploy only Firestore rules + indexes
#   ./scripts/deploy.sh web           Build and show Vercel deploy instructions

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo -e "${GREEN}PropWise AI — Deploy${NC}"
echo "──────────────────────────────────────"

# Check prerequisites
check_prereqs() {
  if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Error: Firebase CLI not installed.${NC}"
    echo "Install with: npm install -g firebase-tools"
    exit 1
  fi

  if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js not installed.${NC}"
    exit 1
  fi
}

deploy_functions() {
  echo -e "\n${YELLOW}Building functions...${NC}"
  cd "$PROJECT_ROOT/functions"
  npm run build
  echo -e "${GREEN}Functions build OK${NC}"

  echo -e "\n${YELLOW}Deploying functions to Firebase...${NC}"
  cd "$PROJECT_ROOT"
  firebase deploy --only functions
  echo -e "${GREEN}Functions deployed!${NC}"
}

deploy_firestore() {
  echo -e "\n${YELLOW}Deploying Firestore rules + indexes...${NC}"
  cd "$PROJECT_ROOT"
  firebase deploy --only firestore
  echo -e "${GREEN}Firestore rules and indexes deployed!${NC}"
}

deploy_web() {
  echo -e "\n${YELLOW}Building web...${NC}"
  cd "$PROJECT_ROOT/web"
  npx next build
  echo -e "${GREEN}Web build OK${NC}"
  echo -e "\n${YELLOW}To deploy web to Vercel:${NC}"
  echo "  cd web && vercel --prod"
  echo "  Or push to main — Vercel auto-deploys from GitHub."
}

check_prereqs

case "${1:-all}" in
  functions)
    deploy_functions
    ;;
  firestore)
    deploy_firestore
    ;;
  web)
    deploy_web
    ;;
  all)
    deploy_functions
    deploy_firestore
    deploy_web
    ;;
  *)
    echo "Usage: $0 [functions|firestore|web|all]"
    exit 1
    ;;
esac

echo -e "\n${GREEN}Deploy complete!${NC}"
