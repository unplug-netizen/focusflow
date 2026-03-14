#!/bin/bash
# Firebase Test Lab Setup Script for FocusFlow
# Dieses Skript konfiguriert Firebase Auth für lokale Test-Lab-Tests

echo "=========================================="
echo "  FocusFlow Firebase Test Lab Setup"
echo "=========================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud nicht gefunden"
    echo "Installiere Google Cloud SDK..."
    exit 1
fi

# Check if firebase is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ firebase CLI nicht gefunden"
    exit 1
fi

echo "✅ gcloud gefunden: $(gcloud --version | head -1)"
echo "✅ firebase gefunden: $(firebase --version)"
echo ""

# Check for service account key
if [ -f "service-account.json" ]; then
    echo "✅ Service Account Key gefunden (service-account.json)"
    
    # Activate service account
    export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/service-account.json"
    gcloud auth activate-service-account --key-file=service-account.json
    
    # Get project ID from service account
    PROJECT_ID=$(cat service-account.json | grep -o '"project_id": "[^"]*"' | cut -d'"' -f4)
    echo "📋 Firebase Project ID: $PROJECT_ID"
    
    gcloud config set project $PROJECT_ID
    
    echo ""
    echo "✅ Firebase authentifiziert!"
    echo ""
    echo "Teste Verbindung..."
    gcloud firebase test android models list 2>&1 | head -10
    
else
    echo "❌ Service Account Key NICHT gefunden"
    echo ""
    echo "Bitte erstelle einen Service Account:"
    echo "1. Gehe zu https://console.cloud.google.com/"
    echo "2. IAM & Admin → Service Accounts"
    echo "3. CREATE SERVICE ACCOUNT"
    echo "   - Name: focusflow-testlab"
    echo "   - Rolle: Firebase Test Lab Admin + Storage Admin"
    echo "4. Erstelle JSON Key und speichere als 'service-account.json'"
    echo ""
    echo "Dann führe dieses Skript erneut aus."
fi
