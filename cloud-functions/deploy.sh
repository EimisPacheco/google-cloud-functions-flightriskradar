#!/bin/bash

echo "🚀 Deploying Flight Risk Analysis Cloud Function with Enhanced Configuration..."

# Load environment variables from flight-risk-analysis/.env.local if it exists
if [ -f "flight-risk-analysis/.env.local" ]; then
    echo "📄 Loading environment variables from flight-risk-analysis/.env.local..."
    export $(cat flight-risk-analysis/.env.local | grep -v '^#' | xargs)
elif [ -f ".env.local" ]; then
    echo "📄 Loading environment variables from .env.local..."
    export $(cat .env.local | grep -v '^#' | xargs)
else
    echo "⚠️  No .env.local file found. Checking if variables are already set..."
fi

# Check if environment variables are set
if [ -z "$GOOGLE_API_KEY" ] || [ -z "$OPENWEATHER_API_KEY" ] || [ -z "$SERPAPI_API_KEY" ]; then
    echo "❌ Environment variables GOOGLE_API_KEY, OPENWEATHER_API_KEY, and SERPAPI_API_KEY must be set"
    echo "Run: source .env.local"
    exit 1
fi

# Get the current Google Cloud project
PROJECT_ID=$(gcloud config get-value project)
FUNCTION_NAME="flight-risk-analysis"
REGION="us-central1"

echo "📦 Project: $PROJECT_ID"
echo "🔧 Function: $FUNCTION_NAME"  
echo "🌍 Region: $REGION"

# Navigate to the function directory
cd flight-risk-analysis

# Deploy with the new OpenWeatherMap API key
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
    echo "✅ Cloud Function deployed successfully!"
    echo "🌐 Function URL:"
    gcloud functions describe $FUNCTION_NAME --region=$REGION --format="value(serviceConfig.uri)"
    
    echo ""
    echo "📊 Function Configuration:"
    echo "  • Runtime: Python 3.11"
    echo "  • Memory: 2GiB (balanced for Google ADK)" 
    echo "  • CPU: 2 cores (quota-optimized)"
    echo "  • Timeout: 900s (extended for startup)"
    echo "  • Max Instances: 10 (within quota limits)"
    echo "  • Concurrency: 5 (optimized for stability)"
    echo "  • Generation: 2"
    echo ""
    echo "🔧 Troubleshooting Applied:"
    echo "  • Functions Framework handles PORT environment variable automatically"
    echo "  • Extended timeout prevents startup issues (900s)"
    echo "  • Balanced memory and CPU for Google ADK startup"
    echo "  • Reduced concurrency for container stability"
    echo "  • Configuration optimized for quota compliance"
    echo ""
    echo "🎯 Key Improvements for Container Startup:"
    echo "  • 900s timeout allows adequate startup time for Google ADK"
    echo "  • 2GiB memory sufficient for AI dependencies"
    echo "  • Reduced concurrency prevents resource contention"
    echo "  • Gen2 environment provides better startup performance"
else
    echo "❌ Deployment failed. Check the logs above for details."
    echo ""
    echo "🛠️ If container startup timeout issues persist:"
    echo "This is commonly caused by:"
    echo "  • Google ADK initialization taking longer than expected"
    echo "  • Complex AI model loading during startup"
    echo "  • Network latency in BigQuery/API connections"
    echo "  • Resource constraints during cold start"
    echo ""
    echo "📋 Advanced troubleshooting if needed:"
    echo "  • Check Cloud Logging for specific startup errors"
    echo "  • Monitor memory usage during startup"
    echo "  • Consider lazy loading of AI components"
    echo "  • Verify BigQuery connection establishment"
    exit 1
fi 

cd ../.. 