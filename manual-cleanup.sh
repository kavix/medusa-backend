#!/bin/bash

# Quick manual cleanup script - safer version with more confirmations
# Usage: ./manual-cleanup.sh

RESOURCE_GROUP="medusa-ctf-rg"

echo "🔍 Checking Azure web apps in: $RESOURCE_GROUP"
echo ""

# List current apps
az webapp list --resource-group "$RESOURCE_GROUP" --query "[].{Name:name, Created:createdTime, URL:defaultHostName}" --output table

echo ""
echo "🤔 Do you want to run the cleanup (keep only latest app)?"
echo "This will:"
echo "  ✅ Keep the most recently created app"
echo "  ❌ Delete all other apps permanently"
echo ""

read -p "Continue with cleanup? (y/N): " confirm

if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "❌ Cleanup cancelled"
    exit 0
fi

echo ""
echo "🧹 Running cleanup script..."
./cleanup-latest-only.sh

echo ""
echo "✅ Manual cleanup completed!"
