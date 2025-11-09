#!/bin/bash

# Community Feed Backend Deployment Script

echo "🚀 Deploying Community Feed Backend Cloud Function..."

# Set project and function details
PROJECT_ID="crafty-cairn-469222-a8"
FUNCTION_NAME="community-feed-backend"
REGION="us-central1"
RUNTIME="python311"
ENTRY_POINT="community_feed_handler"
MEMORY="512MB"
TIMEOUT="540s"
MAX_INSTANCES="10"

# Deploy the function
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
    --max-instances=$MAX_INSTANCES \
    --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID" \
    --project=$PROJECT_ID

echo "✅ Community Feed Backend deployed successfully!"
echo "🌐 Function URL: https://$REGION-$PROJECT_ID.cloudfunctions.net/$FUNCTION_NAME" 