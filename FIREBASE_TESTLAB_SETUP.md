# Firebase Test Lab Setup für FocusFlow

Dieses Setup führt automatisierte Tests auf echten Android-Geräten durch – so wie du die App selbst auf deinem Handy testen würdest.

## 🎯 Was passiert?

**Robo-Test**: Ein intelligenter Crawler erkundet die App automatisch:
- Klickt auf alle Buttons und interaktiven Elemente
- Tippt in Textfelder ein
- Navigiert durch alle Screens
- Findet Crashes und ANRs (App Not Responding)
- Erstellt Videos und Screenshots

## 📋 Voraussetzungen

### 1. Firebase Projekt

1. Gehe zu [Firebase Console](https://console.firebase.google.com/)
2. Erstelle ein neues Projekt (oder nutze bestehendes)
3. Notiere die **Project ID**

### 2. Google Cloud Service Account

1. Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
2. Wähle dein Firebase-Projekt
3. **IAM & Admin** → **Service Accounts**
4. Klicke **CREATE SERVICE ACCOUNT**
5. Name: `github-actions-testlab`
6. Rolle: **Firebase Test Lab Admin** + **Storage Admin**
7. Erstelle und lade den **JSON Key** herunter

### 3. GitHub Secrets einrichten

In deinem GitHub Repository:

1. **Settings** → **Secrets and variables** → **Actions**
2. Klicke **New repository secret**
3. Füge diese Secrets hinzu:

| Secret Name | Wert |
|-------------|------|
| `FIREBASE_PROJECT_ID` | Deine Firebase Project ID (z.B. `focusflow-12345`) |
| `FIREBASE_SERVICE_ACCOUNT` | Inhalt der heruntergeladenen JSON-Datei |

## 🚀 Test ausführen

### Automatisch (bei jedem Push)
```bash
git add .
git commit -m "Add Firebase Test Lab CI"
git push origin main
```

### Manuell
1. Gehe zu **Actions** Tab im GitHub Repository
2. Wähle **Build & Test FocusFlow**
3. Klicke **Run workflow**

## 📱 Getestete Geräte

| Gerät | Android Version | Bedeutung |
|-------|-----------------|-----------|
| Pixel 5 | Android 11 | Ältere Version |
| Pixel 6 | Android 13 | Aktuelle Version |
| Pixel 7 | Android 14 | Neueste Version |

## 📊 Ergebnisse ansehen

Nach dem Test findest du:

1. **GitHub Actions Log**: Direkt im Actions Tab
2. **Firebase Console**: Detaillierte Ergebnisse
   - Videos der Test-Durchläufe
   - Screenshots von jedem Screen
   - Crash-Logs und ANR-Reports
   - Performance-Metriken

URL: `https://console.firebase.google.com/project/DEINE-PROJECT-ID/testlab/histories`

## 🎮 Robo-Test Verhalten

Der Robo-Test verhält sich wie ein echter Benutzer:
- Er findet alle Buttons und Eingabefelder automatisch
- Er probiert verschiedene Eingaben aus
- Er navigiert durch die App
- Er erkennt, wenn die App abstürzt

### Anpassungen

In `.github/workflows/firebase-test.yml` kannst du anpassen:

```yaml
# Eigene Text-Eingaben definieren
--robo-directives=text:emailInput=dein@test.de,text:passwordInput=deinpasswort

# Andere Geräte testen
--device model=griffin,version=29  # Pixel 4 XL

# Längere Testzeit
--timeout 30m
```

## 💰 Kosten

Firebase Test Lab hat ein **kostenloses Kontingent**:
- 100 Geräte-Minuten/Tag für Android
- 100 Geräte-Minuten/Tag für iOS

Unser Setup (3 Geräte × ~5 Minuten = 15 Minuten) bleibt im kostenlosen Bereich.

## 🔧 Troubleshooting

### "App not built"
- Stelle sicher, dass `android/` Verzeichnis existiert
- Führe lokal aus: `npx react-native android`

### "Permission denied"
- Prüfe, ob Service Account die richtigen Rechte hat
- JSON muss vollständig im Secret gespeichert sein

### "No tests found"
- Robo-Test braucht keine Test-Dateien
- Er testet die App automatisch

## 📝 Nächste Schritte

1. [ ] Firebase Projekt erstellen
2. [ ] Service Account einrichten
3. [ ] GitHub Secrets hinzufügen
4. [ ] Workflow testen
5. [ ] Ergebnisse in Firebase Console prüfen

---

Fragen? Schau in die [Firebase Test Lab Dokumentation](https://firebase.google.com/docs/test-lab)
