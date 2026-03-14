import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "../theme/ThemeContext";
import { RootState, AppDispatch } from "../store";
import { Card, Button, Input } from "../components";
import {
  signInAnonymously,
  signInWithEmail,
  signUpWithEmail,
} from "../store/slices/authSlice";

export const LoginScreen: React.FC = () => {
  const { theme } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const handleAnonymousSignIn = () => {
    dispatch(signInAnonymously());
  };

  const [validationError, setValidationError] = useState<string | null>(null);

  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleEmailAuth = () => {
    setValidationError(null);

    if (!email.trim()) {
      setValidationError("Bitte gib eine E-Mail-Adresse ein");
      return;
    }

    if (!validateEmail(email)) {
      setValidationError("Bitte gib eine gültige E-Mail-Adresse ein");
      return;
    }

    if (!password || password.length < 6) {
      setValidationError("Das Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }

    if (isSignUp && !displayName.trim()) {
      setValidationError("Bitte gib einen Namen ein");
      return;
    }

    if (isSignUp) {
      dispatch(signUpWithEmail({ email, password, displayName }));
    } else {
      dispatch(signInWithEmail({ email, password }));
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>🎯</Text>
            <Text style={[styles.logoText, { color: theme.colors.text }]}>
              FocusFlow
            </Text>
            <Text
              style={[styles.tagline, { color: theme.colors.textSecondary }]}
            >
              Mehr Fokus. Weniger Ablenkung.
            </Text>
          </View>

          {/* Auth Card */}
          <Card style={styles.authCard}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {isSignUp ? "Konto erstellen" : "Willkommen zurück"}
            </Text>

            {isSignUp && (
              <Input
                label="Name"
                placeholder="Dein Name"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            )}

            <Input
              label="E-Mail"
              placeholder="deine@email.de"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Passwort"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {(error || validationError) && (
              <Text style={[styles.error, { color: theme.colors.error }]}>
                {validationError || error}
              </Text>
            )}

            <Button
              title={isSignUp ? "Registrieren" : "Anmelden"}
              onPress={handleEmailAuth}
              loading={isLoading}
              style={styles.authButton}
            />

            <TouchableOpacity
              onPress={() => setIsSignUp(!isSignUp)}
              style={styles.switchButton}
            >
              <Text
                style={[styles.switchText, { color: theme.colors.primary }]}
              >
                {isSignUp
                  ? "Bereits ein Konto? Anmelden"
                  : "Noch kein Konto? Registrieren"}
              </Text>
            </TouchableOpacity>
          </Card>

          {/* Anonymous Option */}
          <TouchableOpacity
            onPress={handleAnonymousSignIn}
            style={styles.anonymousButton}
            disabled={isLoading}
          >
            <Text
              style={[
                styles.anonymousText,
                { color: theme.colors.textSecondary },
              ]}
            >
              Oder fortfahren als Gast →
            </Text>
          </TouchableOpacity>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <FeatureItem icon="🚫" text="Blockiere ablenkende Apps" />
            <FeatureItem icon="🎯" text="Fokus-Modus mit Timer" />
            <FeatureItem icon="📊" text="Verfolge deine Fortschritte" />
            <FeatureItem icon="🏆" text="Sammle Badges & Coins" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const FeatureItem: React.FC<{ icon: string; text: string }> = ({
  icon,
  text,
}) => {
  const { theme } = useTheme();
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 32,
  },
  logoIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
  },
  authCard: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },
  error: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  authButton: {
    marginTop: 8,
  },
  switchButton: {
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 8,
  },
  switchText: {
    fontSize: 14,
    fontWeight: "500",
  },
  anonymousButton: {
    alignItems: "center",
    paddingVertical: 16,
  },
  anonymousText: {
    fontSize: 14,
  },
  featuresContainer: {
    marginTop: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 32,
  },
  featureText: {
    fontSize: 14,
  },
});

export default LoginScreen;
