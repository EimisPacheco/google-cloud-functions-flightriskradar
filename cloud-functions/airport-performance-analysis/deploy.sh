#!/bin/bash

# Deployment script for Airport Performance Analysis Cloud Function
# Project ID should be set as environment variable or passed as argument

# Use environment variable or default
PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-crafty-cairn-469222-a8}"
FUNCTION_NAME="airport-performance-analysis"
REGION="us-central1"
RUNTIME="python311"
ENTRY_POINT="airport_performance_analysis"
MEMORY="512MB"
TIMEOUT="540s"

echo "🚀 Deploying Airport Performance Analysis Cloud Function to project: $PROJECT_ID"
echo "Region: $REGION"
echo "Function: $FUNCTION_NAME"

# Deploy the function with environment variables
gcloud functions deploy $FUNCTION_NAME \
    --gen2 \
    --runtime=$RUNTIME \
    --region=$REGION \
    --source=. \
    --entry-point=$ENTRY_POINT \
    --trigger-http \
    --allow-unauthenticated \
    --memory=$MEMORY \
    --timeout=$TIMEOUT \
    --project=$PROJECT_ID \
    --set-env-vars="OPENWEATHER_API_KEY=${OPENWEATHER_API_KEY:-bc50a2de0e54181ecaa2c0495dd29fc3}"

# Check deployment status
if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "Function URL:"
    gcloud functions describe $FUNCTION_NAME \
        --region=$REGION \
        --project=$PROJECT_ID \
        --format="value(serviceConfig.uri)"
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi