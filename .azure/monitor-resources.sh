#!/bin/bash

# Azure Resource Monitor Script
# Monitors and alerts about resource usage to prevent unexpected costs

RESOURCE_GROUP="medusa-ctf-rg"
MAX_WEBAPPS=2  # Alert if more than 2 web apps exist
MAX_APP_PLANS=1  # Alert if more than 1 app service plan exists

echo "🔍 Azure Resource Monitor for $RESOURCE_GROUP"
echo "============================================="
echo ""

# Check web apps
echo "📱 Web Apps Analysis:"
webapps=$(az webapp list --resource-group $RESOURCE_GROUP --query "[].{Name:name,State:state,Url:defaultHostName}" --output table)
webapp_count=$(az webapp list --resource-group $RESOURCE_GROUP --query "length(@)" --output tsv)

echo "$webapps"
echo ""
echo "Total Web Apps: $webapp_count"

if [ $webapp_count -gt $MAX_WEBAPPS ]; then
    echo "⚠️  WARNING: You have $webapp_count web apps (limit: $MAX_WEBAPPS)"
    echo "   Consider running cleanup script: .azure/cleanup-webapps.sh"
else
    echo "✅ Web app count is within limits"
fi

echo ""

# Check App Service Plans
echo "🏗️  App Service Plans Analysis:"
plans=$(az appservice plan list --resource-group $RESOURCE_GROUP --query "[].{Name:name,Sku:sku.name,Location:location}" --output table)
plan_count=$(az appservice plan list --resource-group $RESOURCE_GROUP --query "length(@)" --output tsv)

echo "$plans"
echo ""
echo "Total App Service Plans: $plan_count"

if [ $plan_count -gt $MAX_APP_PLANS ]; then
    echo "⚠️  WARNING: You have $plan_count app service plans (limit: $MAX_APP_PLANS)"
else
    echo "✅ App service plan count is within limits"
fi

echo ""

# Cost estimation (rough)
echo "💰 Cost Estimation:"
if [ $webapp_count -le 1 ] && [ $plan_count -le 1 ]; then
    echo "   Estimated cost: FREE (within Azure Student limits)"
else
    echo "   ⚠️  Potential cost: May exceed free tier limits"
fi

echo ""

# Recommendations
echo "💡 Recommendations:"
echo "   1. Keep only 1 production app for main branch"
echo "   2. Use temporary apps for feature branches (auto-delete)"
echo "   3. Run this monitor weekly: .azure/monitor-resources.sh"
echo "   4. Use fixed app names instead of timestamp-based names"

echo ""
echo "🔗 Quick Actions:"
echo "   Clean up: .azure/cleanup-webapps.sh"
echo "   Deploy:   git push origin main"
echo "   Monitor:  .azure/monitor-resources.sh"
