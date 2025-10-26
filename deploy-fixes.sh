#!/bin/bash

echo "🚀 Deploying College Central Fixes..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Deploy Firestore Rules
echo -e "${YELLOW}Step 1/3: Deploying Firestore Rules...${NC}"
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Firestore rules deployed successfully!${NC}"
    echo ""
else
    echo -e "${RED}❌ Failed to deploy Firestore rules${NC}"
    exit 1
fi

# Step 2: Build the app
echo -e "${YELLOW}Step 2/3: Building the app...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully!${NC}"
    echo ""
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 3: Deploy to Firebase Hosting
echo -e "${YELLOW}Step 3/3: Deploying to Firebase Hosting...${NC}"
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Hosting deployed successfully!${NC}"
    echo ""
else
    echo -e "${RED}❌ Failed to deploy hosting${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 All fixes deployed successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)"
echo "2. Check the browser console - 400 errors should be gone"
echo "3. COOP warnings are safe to ignore (they don't break functionality)"
echo ""
echo "📚 For more info, see FIRESTORE_TROUBLESHOOTING.md"
