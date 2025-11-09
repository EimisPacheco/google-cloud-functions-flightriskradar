#!/bin/bash

# Deploy Community Feed Elasticsearch Cloud Function
# For AI Accelerate Hackathon - Elastic Challenge

echo "🚀 Deploying community-feed-elasticsearch function..."

# Get environment variables
if [ -f "../../.env.local" ]; then
    export $(cat ../../.env.local | grep -v '^#' | xargs)
fi

# Deploy function
gcloud functions deploy community-feed-elasticsearch \
  --gen2 \
  --runtime=python311 \
  --region=us-central1 \
  --source=. \
  --entry-point=community_feed_elasticsearch \
  --trigger-http \
  --allow-unauthenticated \
  --timeout=120s \
  --memory=512MB \
  --set-env-vars GOOGLE_API_KEY=$GOOGLE_API_KEY,ELASTICSEARCH_URL=$ELASTICSEARCH_URL,ELASTICSEARCH_API_KEY=$ELASTICSEARCH_API_KEY \
  --project=crafty-cairn-469222-a8

echo "✅ Deployment complete!"
echo ""
echo "📡 Function URL:"
echo "https://us-central1-crafty-cairn-469222-a8.cloudfunctions.net/community-feed-elasticsearch"
