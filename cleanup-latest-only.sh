#!/bin/bash

# Script to cleanup Azure web apps, keeping only the latest one
# This script identifies the latest web app by creation time and deletes all others

RESOURCE_GROUP="medusa-ctf-rg"

echo "🔍 Finding all web apps in resource group: $RESOURCE_GROUP"

# Get all web apps with their creation times
apps_json=$(az webapp list --resource-group "$RESOURCE_GROUP" --query "[].{name:name, createdTime:createdTime}" -o json)

if [ -z "$apps_json" ] || [ "$apps_json" = "[]" ]; then
    echo "❌ No web apps found in resource group $RESOURCE_GROUP"
    exit 1
fi

# Count total apps
total_apps=$(echo "$apps_json" | jq '. | length')
echo "📊 Found $total_apps web apps total"

if [ "$total_apps" -le 1 ]; then
    echo "✅ Only one or no apps found, no cleanup needed"
    exit 0
fi

# Find the latest app by creation time
latest_app=$(echo "$apps_json" | jq -r 'sort_by(.createdTime) | last | .name')
echo "🎯 Latest app identified: $latest_app"

# Get all apps except the latest one
apps_to_delete=$(echo "$apps_json" | jq -r --arg latest "$latest_app" '.[] | select(.name != $latest) | .name')

if [ -z "$apps_to_delete" ]; then
    echo "✅ No apps to delete"
    exit 0
fi

echo "🗑️  Apps to be deleted:"
echo "$apps_to_delete"
echo ""

# Confirm before deletion (skip in CI/CD)
if [ "$CI" != "true" ] && [ "$GITHUB_ACTIONS" != "true" ]; then
    read -p "⚠️  Are you sure you want to delete these apps? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "❌ Cleanup cancelled"
        exit 0
    fi
fi

# Delete old apps
deleted_count=0
failed_count=0

echo "🧹 Starting cleanup..."
echo "$apps_to_delete" | while read -r app_name; do
    if [ ! -z "$app_name" ]; then
        echo "Deleting: $app_name"
        if az webapp delete --name "$app_name" --resource-group "$RESOURCE_GROUP" --only-show-errors; then
            echo "✅ Successfully deleted: $app_name"
            ((deleted_count++))
        else
            echo "❌ Failed to delete: $app_name"
            ((failed_count++))
        fi
    fi
done

echo ""
echo "🎉 Cleanup completed!"
echo "📈 Apps deleted: $deleted_count"
echo "❌ Failed deletions: $failed_count"
echo "🏆 Kept latest app: $latest_app"

# Show remaining apps
echo ""
echo "📋 Remaining apps:"
az webapp list --resource-group "$RESOURCE_GROUP" --query "[].{Name:name, CreatedTime:createdTime, Url:defaultHostName}" --output table

# Test the remaining app
if [ "$CI" = "true" ] || [ "$GITHUB_ACTIONS" = "true" ]; then
    echo ""
    echo "🧪 Testing remaining app..."
    app_url="https://${latest_app}.azurewebsites.net"
    
    # Wait a moment for any restart to complete
    sleep 10
    
    if curl -f -s "$app_url" > /dev/null; then
        echo "✅ App is responding: $app_url"
    else
        echo "⚠️  App may not be responding: $app_url"
    fi
fi
