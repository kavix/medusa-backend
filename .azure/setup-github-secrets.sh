#!/bin/bash
# Azure Service Principal Setup for GitHub Actions Auto-Deployment

echo "🔧 Setting up Azure Service Principal for GitHub Actions..."

# Get your subscription ID
SUBSCRIPTION_ID=$(az account show --query id --output tsv)
echo "📝 Subscription ID: $SUBSCRIPTION_ID"

# Create service principal
echo "🔑 Creating service principal..."
SP_OUTPUT=$(az ad sp create-for-rbac \
  --name "github-actions-medusa-ctf" \
  --role contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/medusa-ctf-rg \
  --json-auth)

echo "✅ Service Principal created!"
echo ""
echo "🚨 IMPORTANT: Copy the following JSON output to GitHub Secrets"
echo "📍 Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions"
echo "📍 Create new secret named: AZURE_CREDENTIALS"
echo "📍 Paste this exact content:"
echo ""
echo "============== COPY THIS =============="
echo "$SP_OUTPUT"
echo "======================================="
echo ""
echo "🎯 After adding the secret, your auto-deployment will work on every commit!"
echo ""
echo "🧪 Test commands for your deployed apps:"
echo "curl -X POST 'https://YOUR-APP-NAME.azurewebsites.net/login' \\"
echo "  -H 'Content-Type: application/x-www-form-urlencoded' \\"
echo "  -d \"username=admin' OR '1'='1' --&password=test\" \\"
echo "  -v"
