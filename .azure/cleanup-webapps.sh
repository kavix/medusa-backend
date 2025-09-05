#!/bin/bash

# Azure Web Apps Cleanup Script
# This script removes all old/unwanted web apps except the production one

RESOURCE_GROUP="medusa-ctf-rg"
PRODUCTION_APP="medusa-ctf-production"

echo "🧹 Starting Azure Web Apps cleanup..."
echo "Resource Group: $RESOURCE_GROUP"
echo "Production App (will be preserved): $PRODUCTION_APP"
echo ""

# Get all web apps in the resource group
echo "📋 Fetching all web apps..."
webapps=$(az webapp list --resource-group $RESOURCE_GROUP --query "[].name" --output tsv)

if [ -z "$webapps" ]; then
    echo "❌ No web apps found in resource group $RESOURCE_GROUP"
    exit 1
fi

echo "Found web apps:"
echo "$webapps"
echo ""

# Count total apps
total_apps=$(echo "$webapps" | wc -l)
deleted_count=0
preserved_count=0

echo "🗑️ Starting deletion process..."
echo ""

# Delete each app except production
for app in $webapps; do
    if [ "$app" = "$PRODUCTION_APP" ]; then
        echo "✅ Preserving production app: $app"
        ((preserved_count++))
    else
        echo "🗑️ Deleting: $app"
        if az webapp delete --name "$app" --resource-group "$RESOURCE_GROUP" --no-wait; then
            echo "   ✅ Deletion initiated for $app"
            ((deleted_count++))
        else
            echo "   ❌ Failed to delete $app"
        fi
    fi
done

echo ""
echo "📊 Cleanup Summary:"
echo "   Total apps found: $total_apps"
echo "   Apps deleted: $deleted_count"
echo "   Apps preserved: $preserved_count"
echo ""

if [ $deleted_count -gt 0 ]; then
    echo "⏳ Note: Deletions are running in background (--no-wait)"
    echo "   It may take a few minutes to complete."
    echo ""
    echo "🔍 To check status, run:"
    echo "   az webapp list --resource-group $RESOURCE_GROUP --output table"
fi

echo ""
echo "✨ Cleanup script completed!"
