#!/bin/bash
# Build APK und führe Firebase Test Lab Test durch

set -e

echo "=========================================="
echo "  FocusFlow Build & Firebase Test Lab"
echo "=========================================="
echo ""

# Setup paths
export PATH="$PATH:/data/google-cloud-sdk/bin"
export ANDROID_HOME="${ANDROID_HOME:-/usr/lib/android-sdk}"

# Check prerequisites
if [ ! -f "service-account.json" ]; then
    echo "❌ service-account.json nicht gefunden!"
    echo "Führe zuerst ./scripts/setup-firebase-testlab.sh aus"
    exit 1
fi

# Auth
echo "🔐 Authentifiziere mit Service Account..."
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/service-account.json"
gcloud auth activate-service-account --key-file=service-account.json 2>/dev/null || true

PROJECT_ID=$(cat service-account.json | grep -o '"project_id": "[^"]*"' | cut -d'"' -f4)
gcloud config set project $PROJECT_ID --quiet

echo "📋 Project: $PROJECT_ID"
echo ""

# Build
echo "🔨 Baue Debug APK..."
cd android
./gradlew assembleDebug --no-daemon --quiet
cd ..

APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"

if [ ! -f "$APK_PATH" ]; then
    echo "❌ APK nicht gefunden: $APK_PATH"
    exit 1
fi

echo "✅ APK gebaut: $APK_PATH"
echo ""

# Test Lab
echo "🧪 Starte Firebase Test Lab..."
echo ""

RESULTS_DIR="focusflow-$(date +%Y%m%d-%H%M%S)"

gcloud firebase test android run \
    --type robo \
    --app "$APK_PATH" \
    --device model=redfin,version=30,locale=de_DE,orientation=portrait \
    --device model=oriole,version=33,locale=de_DE,orientation=portrait \
    --timeout 15m \
    --robo-directives=text:emailInput=test@example.com,text:passwordInput=test123 \
    --results-bucket="gs://${PROJECT_ID}-testlab" \
    --results-dir="$RESULTS_DIR" \
    --quiet

echo ""
echo "=========================================="
echo "  ✅ Test Complete!"
echo "=========================================="
echo ""
echo "Ergebnisse:"
echo "https://console.firebase.google.com/project/${PROJECT_ID}/testlab/histories"
echo ""
echo "Bucket: gs://${PROJECT_ID}-testlab/${RESULTS_DIR}"
