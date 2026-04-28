#!/bin/bash

# EcoFeed Deployment Script
# Usage: ./deploy.sh [environment] [action]
# Example: ./deploy.sh production up

set -e

ENVIRONMENT=${1:-development}
ACTION=${2:-up}
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}╔════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║       EcoFeed Deployment Script        ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════╝${NC}"

# Check if .env file exists
if [ "$ENVIRONMENT" = "production" ]; then
  ENV_FILE=".env.production"
  COMPOSE_FILE="docker-compose.prod.yml"
else
  ENV_FILE=".env.local"
  COMPOSE_FILE="docker-compose.yml"
fi

if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}✗ Error: $ENV_FILE not found${NC}"
  echo -e "${YELLOW}Please create $ENV_FILE first. Use .env.example as a template.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Environment: $ENVIRONMENT${NC}"
echo -e "${GREEN}✓ Using config: $ENV_FILE${NC}"
echo -e "${GREEN}✓ Compose file: $COMPOSE_FILE${NC}"

# Function to deploy
deploy_app() {
  echo -e "${YELLOW}Starting deployment...${NC}"
  
  # Load environment variables
  export $(cat $ENV_FILE | grep -v '^#' | xargs)
  
  case $ACTION in
    up)
      echo -e "${YELLOW}Building and starting services...${NC}"
      docker-compose -f $COMPOSE_FILE up -d
      ;;
    down)
      echo -e "${YELLOW}Stopping services...${NC}"
      docker-compose -f $COMPOSE_FILE down
      ;;
    restart)
      echo -e "${YELLOW}Restarting services...${NC}"
      docker-compose -f $COMPOSE_FILE restart
      ;;
    rebuild)
      echo -e "${YELLOW}Rebuilding images...${NC}"
      docker-compose -f $COMPOSE_FILE build --no-cache
      docker-compose -f $COMPOSE_FILE up -d
      ;;
    logs)
      docker-compose -f $COMPOSE_FILE logs -f
      ;;
    ps)
      docker-compose -f $COMPOSE_FILE ps
      ;;
    *)
      echo -e "${RED}Unknown action: $ACTION${NC}"
      echo "Available actions: up, down, restart, rebuild, logs, ps"
      exit 1
      ;;
  esac
}

# Function to verify deployment
verify_deployment() {
  echo -e "${YELLOW}Verifying deployment...${NC}"
  
  sleep 2
  
  # Check backend
  if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
  else
    echo -e "${RED}✗ Backend is not responding${NC}"
  fi
  
  # Check frontend
  if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is responding${NC}"
  else
    echo -e "${RED}✗ Frontend is not responding${NC}"
  fi
}

# Execute deployment
if [ "$ACTION" != "logs" ] && [ "$ACTION" != "ps" ]; then
  deploy_app
  
  if [ "$ACTION" = "up" ] || [ "$ACTION" = "rebuild" ]; then
    verify_deployment
    
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║      Deployment Complete! 🎉           ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo -e ""
    echo -e "Frontend: ${GREEN}http://localhost:3000${NC}"
    echo -e "Backend:  ${GREEN}http://localhost:8000${NC}"
    echo -e "API Docs: ${GREEN}http://localhost:8000/docs${NC}"
  fi
else
  deploy_app
fi
