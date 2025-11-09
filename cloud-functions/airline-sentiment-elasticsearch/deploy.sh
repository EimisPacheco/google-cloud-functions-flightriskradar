#!/bin/bash

# Deploy Airline Sentiment Elasticsearch Cloud Function
# For AI Accelerate Hackathon - Elastic Challenge

echo "🚀 Deploying airline-sentiment-elasticsearch function..."

# Get environment variables
if [ -f "../../.env.local" ]; then
    export $(cat ../../.env.local | grep -v '^#' | xargs)
fi

# Deploy function
gcloud functions deploy airline-sentiment-elasticsearch \
  --gen2 \
  --runtime=python311 \
  --region=us-central1 \
  --source=. \
  --entry-point=airline_sentiment_elasticsearch \
  --trigger-http \
  --allow-unauthenticated \
  --timeout=120s \
  --memory=512MB \
  --set-env-vars GOOGLE_API_KEY=$GOOGLE_API_KEY,ELASTICSEARCH_URL=$ELASTICSEARCH_URL,ELASTICSEARCH_API_KEY=$ELASTICSEARCH_API_KEY \
  --project=crafty-cairn-469222-a8

echo "✅ Deployment complete!"
echo ""
echo "📡 Function URL:"
echo "https://us-central1-crafty-cairn-469222-a8.cloudfunctions.net/airline-sentiment-elasticsearch"
