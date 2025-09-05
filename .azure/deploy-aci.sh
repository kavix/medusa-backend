#!/bin/bash
# Azure Web App deployment for Medusa CTF Challenge

RESOURCE_GROUP="medusa-ctf-rg"
APP_NAME="medusa-ctf-$(date +%s)"
PLAN_NAME="medusa-ctf-plan"
LOCATION="southeastasia"

echo "🚀 Deploying Medusa CTF Challenge to Azure..."
echo "Creating resource group in $LOCATION..."
az group create --name $RESOURCE_GROUP --location $LOCATION

echo "Deploying resources with ARM template..."
az deployment group create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --template-file .azure/azure-deploy.json \
  --parameters \
    appName=$APP_NAME \
    planName=$PLAN_NAME \
    location=$LOCATION

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🎯 Your CTF challenge is available at: https://$APP_NAME.azurewebsites.net"
    echo "📝 Flag: Medusa{CTF_CHALLENGE_PHASE1_PASSED}"
    echo "💡 Challenge: Find the SQL injection vulnerability to capture the flag"
else
    echo "❌ Deployment failed!"
    exit 1
fi
