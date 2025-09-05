#!/bin/bash

# List of web apps to delete (all except medusa-main-9e89f62 which is our latest)
APPS_TO_DELETE=(
    "medusa-main-1f2dca9"
    "medusa-main-e1c0d0c"
    "medusa-main-2ba140d"
    "medusa-ctf-production"
    "medusa-main-271fdba"
    "medusa-main-3d483a9"
    "medusa-main-7c8d7a4"
    "medusa-main-520605c"
    "medusa-main-a418156"
    "medusa-main-87a2503"
    "medusa-main-37a2dd6"
    "medusa-main-356bd01"
    "medusa-main-ceef9f4"
    "medusa-main-a0e57d3"
)

RESOURCE_GROUP="medusa-ctf-rg"

echo "Keeping: medusa-main-9e89f62 (latest deployment with commit 9e89f62)"
echo "Deleting ${#APPS_TO_DELETE[@]} old web apps..."

for app in "${APPS_TO_DELETE[@]}"; do
    echo "Deleting $app..."
    az webapp delete --name "$app" --resource-group "$RESOURCE_GROUP" --only-show-errors
    if [ $? -eq 0 ]; then
        echo "✓ Successfully deleted $app"
    else
        echo "✗ Failed to delete $app"
    fi
done

echo "Cleanup complete! Remaining apps:"
az webapp list --resource-group "$RESOURCE_GROUP" --query "[].name" --output table
