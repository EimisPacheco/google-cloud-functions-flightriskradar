#!/bin/bash

echo "🔄 Deploying with debug info..."
echo "============================================================"

cd "/Users/eimis/Documents/HACKTHONS-2025/GOOGLE-AGENT-DEVELOPMENT-KIT/partners -FlightRiskRadar/cloud-functions"

# Load environment variables
if [ -f "flight-risk-analysis/.env.local" ]; then
    echo "📄 Loading environment variables..."
    export $(cat flight-risk-analysis/.env.local | grep -v '^#' | xargs)
else
    echo "❌ .env.local file not found!"
    exit 1
fi

cd flight-risk-analysis

gcloud functions deploy flight-risk-analysis \
  --gen2 \
  --runtime=python311 \
  --region=us-central1 \
  --source=. \
  --entry-point=main \
  --trigger-http \
  --allow-unauthenticated \
  --memory=2Gi \
  --cpu=2 \
  --timeout=900s \
  --max-instances=10 \
  --concurrency=5 \
  --set-env-vars="GOOGLE_API_KEY=$GOOGLE_API_KEY,LOG_EXECUTION_ID=true,OPENWEATHER_API_KEY=$OPENWEATHER_API_KEY,SERPAPI_API_KEY=$SERPAPI_API_KEY,ELASTICSEARCH_URL=$ELASTICSEARCH_URL,ELASTICSEARCH_API_KEY=$ELASTICSEARCH_API_KEY"

if [ $? -eq 0 ]; then
    echo ""
    echo "============================================================"
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "============================================================"
    echo ""
    echo "🧪 Test now:"
    echo "  cd ../.."
    echo "  python3 test_session_verbose.py"
    echo ""
    echo "Look for '_debug_session' in the response!"
    echo ""
else
    echo ""
    echo "============================================================"
    echo "❌ DEPLOYMENT FAILED"
    echo "============================================================"
    exit 1
fi
