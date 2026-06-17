#!/bin/bash
set -e

# ===================================================
# ISO 27001 - Google Cloud Run Deployment Script
# ===================================================
# ต้องติดตั้ง gcloud CLI ก่อน: https://cloud.google.com/sdk/docs/install
# และ login ด้วย: gcloud auth login
# ===================================================

# --- กำหนดค่าตามต้องการ ---
PROJECT_ID="${GCP_PROJECT_ID:-your-project-id}"
REGION="${GCP_REGION:-asia-southeast1}"
SERVICE_NAME="iso27001-management"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"
BUCKET_NAME="${PROJECT_ID}-iso27001-data"
NEXTAUTH_SECRET=$(openssl rand -base64 32)

echo "=================================================="
echo " ISO 27001 - Deploying to Google Cloud Run"
echo "=================================================="
echo " Project  : $PROJECT_ID"
echo " Region   : $REGION"
echo " Service  : $SERVICE_NAME"
echo " Bucket   : $BUCKET_NAME"
echo ""

# 1. Enable required APIs
echo "[1/7] Enabling Google Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  containerregistry.googleapis.com \
  storage.googleapis.com \
  --project="$PROJECT_ID"

# 2. Create GCS bucket for persistent data (SQLite DB + uploads)
echo "[2/7] Creating Cloud Storage bucket..."
if ! gsutil ls -b "gs://${BUCKET_NAME}" &>/dev/null; then
  gsutil mb -p "$PROJECT_ID" -l "$REGION" "gs://${BUCKET_NAME}"
  echo "  ✓ Bucket created: gs://${BUCKET_NAME}"
else
  echo "  ✓ Bucket already exists"
fi

# 3. Configure Docker to use gcloud as credential helper
echo "[3/7] Configuring Docker..."
gcloud auth configure-docker --quiet

# 4. Build and push Docker image
echo "[4/7] Building and pushing Docker image..."
docker build --platform linux/amd64 -t "$IMAGE_NAME" .
docker push "$IMAGE_NAME"
echo "  ✓ Image pushed: $IMAGE_NAME"

# 5. Create a Service Account for Cloud Run
echo "[5/7] Setting up Service Account..."
SA_NAME="${SERVICE_NAME}-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

if ! gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" &>/dev/null; then
  gcloud iam service-accounts create "$SA_NAME" \
    --display-name="ISO 27001 Cloud Run SA" \
    --project="$PROJECT_ID"
fi

# Grant access to GCS bucket
gsutil iam ch "serviceAccount:${SA_EMAIL}:roles/storage.objectAdmin" "gs://${BUCKET_NAME}"
echo "  ✓ Service account ready: $SA_EMAIL"

# 6. Deploy to Cloud Run with GCS volume mount
echo "[6/7] Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image="$IMAGE_NAME" \
  --platform=managed \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --service-account="$SA_EMAIL" \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --timeout=60 \
  --set-env-vars="NODE_ENV=production,DATABASE_URL=file:/var/data/iso27001.db,UPLOAD_DIR=/var/data" \
  --set-env-vars="NEXTAUTH_SECRET=${NEXTAUTH_SECRET}" \
  --add-volume="name=iso27001-data,type=cloud-storage,bucket=${BUCKET_NAME}" \
  --add-volume-mount="volume=iso27001-data,mount-path=/var/data" \
  --allow-unauthenticated

# 7. Get the service URL and set NEXTAUTH_URL
echo "[7/7] Finalizing..."
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --platform=managed \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --format="value(status.url)")

gcloud run services update "$SERVICE_NAME" \
  --platform=managed \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --update-env-vars="NEXTAUTH_URL=${SERVICE_URL}"

echo ""
echo "=================================================="
echo " ✅ Deployment Complete!"
echo "=================================================="
echo " URL: $SERVICE_URL"
echo ""
echo " Login credentials:"
echo "   Admin : admin@company.com / Admin@123456"
echo "   User  : user@company.com  / User@123456"
echo ""
echo " NEXTAUTH_SECRET (บันทึกเก็บไว้):"
echo "   $NEXTAUTH_SECRET"
echo "=================================================="
