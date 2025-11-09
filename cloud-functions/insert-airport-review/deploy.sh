#!/bin/bash

echo "🚀 Deploying Insert Airport Review Cloud Function..."

gcloud functions deploy insert-airport-review \
  --gen2 \
  --runtime=python311 \
  --region=us-central1 \
  --source=. \
  --entry-point=main \
  --trigger-http \
  --allow-unauthenticated \
  --memory=512Mi \
  --timeout=60s \
  --set-env-vars="GCP_PROJECT=crafty-cairn-469222-a8"

if [ $? -eq 0 ]; then
    echo "✅ Cloud Function deployed successfully!"
    echo "🌐 Function URL:"
    gcloud functions describe insert-airport-review \
      --region=us-central1 \
      --gen2 \
      --format="value(serviceConfig.uri)"
else
    echo "❌ Deployment failed. Check the logs above for details."
    exit 1
fi
