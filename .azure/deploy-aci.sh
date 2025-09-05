#!/bin/bash
# Azure Web App deployment using ARM template

RESOURCE_GROUP="medusa-ctf-rg"
APP_NAME="medusa-ctf-$(date +%s)"
PLAN_NAME="medusa-ctf-plan"
LOCATION="southeastasia"

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

echo "Deployment complete!"
echo "Your CTF challenge is available at: https://$APP_NAME.azurewebsites.net"
