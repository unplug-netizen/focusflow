import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../theme/ThemeContext";
import { RootState, AppDispatch } from "../store";
import { Card, Button, BadgeCard, Input } from "../components";
import { signOut } from "../store/slices/authSlice";
import {
  toggleDarkMode,
  toggleNotifications,
  toggleSound,
  toggleHaptic,
  setPrivacyMode,
  toggleBedtimeMode,
  setBedtimeMode,
} from "../store/slices/settingsSlice";
import { Badge } from "../types";

export const ProfileScreen: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const stats = useSelector((state: RootState) => state.stats);
  const settings = useSelector((state: RootState) => state.settings);
  const [showBedtimePicker, setShowBedtimePicker] = useState(false);

  const unlockedBadges = stats.badges.filter((b) => b.unlockedAt);
  const lockedBadges = stats.badges.filter((b) => !b.unlockedAt);

  const handleSignOut = () => {
    dispatch(signOut());
  };

  const handleToggleDarkMode = () => {
    dispatch(toggleDarkMode());
    toggleTheme();
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Profil
          </Text>
        </View>

        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.displayName?.charAt(0).toUpperCase() || "?"}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: theme.colors.text }]}>
                {user?.displayName || "Gast User"}
              </Text>
              <Text
                style={[
                  styles.userEmail,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {user?.email || "Anonym"}
              </Text>
              {user?.isAnonymous && (
                <View style={styles.anonymousBadge}>
                  <Text style={styles.anonymousText}>Anonym</Text>
                </View>
              )}
            </View>
          </View>
          <Button
            title="Bearbeiten"
            variant="outline"
            size="small"
            onPress={() => {}}
          />
        </Card>

        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {stats.focusCoins}
            </Text>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}
            >
              Focus Coins
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {unlockedBadges.length}
            </Text>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}
            >
              Badges
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {stats.currentStreak}
            </Text>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}
            >
              Streak
            </Text>
          </Card>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Einstellungen
          </Text>

          <Card style={styles.settingsCard}>
            {/* Dark Mode */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text
                  style={[styles.settingLabel, { color: theme.colors.text }]}
                >
                  🌙 Dunkelmodus
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Dunkles Erscheinungsbild verwenden
                </Text>
              </View>
              <Switch
                value={settings.darkMode}
                onValueChange={handleToggleDarkMode}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
                thumbColor="#fff"
              />
            </View>

            <View
              style={[styles.divider, { backgroundColor: theme.colors.border }]}
            />

            {/* Notifications */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text
                  style={[styles.settingLabel, { color: theme.colors.text }]}
                >
                  🔔 Benachrichtigungen
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Push-Benachrichtigungen erhalten
                </Text>
              </View>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={() => {
                  dispatch(toggleNotifications());
                }}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
                thumbColor="#fff"
              />
            </View>

            <View
              style={[styles.divider, { backgroundColor: theme.colors.border }]}
            />

            {/* Sound */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text
                  style={[styles.settingLabel, { color: theme.colors.text }]}
                >
                  🔊 Sound
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Soundeffekte aktivieren
                </Text>
              </View>
              <Switch
                value={settings.soundEnabled}
                onValueChange={() => {
                  dispatch(toggleSound());
                }}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
                thumbColor="#fff"
              />
            </View>

            <View
              style={[styles.divider, { backgroundColor: theme.colors.border }]}
            />

            {/* Haptic */}
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text
                  style={[styles.settingLabel, { color: theme.colors.text }]}
                >
                  📳 Haptisches Feedback
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Vibration bei Aktionen
                </Text>
              </View>
              <Switch
                value={settings.hapticEnabled}
                onValueChange={() => {
                  dispatch(toggleHaptic());
                }}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
                thumbColor="#fff"
              />
            </View>
          </Card>
        </View>

        {/* Bedtime Mode */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Schlafenszeit-Modus
          </Text>
          <Card>
            <View style={styles.bedtimeHeader}>
              <View>
                <Text
                  style={[styles.bedtimeTitle, { color: theme.colors.text }]}
                >
                  Automatisch blockieren
                </Text>
                <Text
                  style={[
                    styles.bedtimeDescription,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {settings.bedtimeMode.startTime} -{" "}
                  {settings.bedtimeMode.endTime}
                </Text>
              </View>
              <Switch
                value={settings.bedtimeMode.enabled}
                onValueChange={() => {
                  dispatch(toggleBedtimeMode());
                }}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primary,
                }}
                thumbColor="#fff"
              />
            </View>
            {settings.bedtimeMode.enabled && (
              <View style={styles.bedtimeTimes}>
                <View style={styles.timeInput}>
                  <Text
                    style={[
                      styles.timeLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Start
                  </Text>
                  <Text
                    style={[styles.timeValue, { color: theme.colors.text }]}
                  >
                    {settings.bedtimeMode.startTime}
                  </Text>
                </View>
                <View style={styles.timeInput}>
                  <Text
                    style={[
                      styles.timeLabel,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Ende
                  </Text>
                  <Text
                    style={[styles.timeValue, { color: theme.colors.text }]}
                  >
                    {settings.bedtimeMode.endTime}
                  </Text>
                </View>
              </View>
            )}
          </Card>
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Privatsphäre
          </Text>
          <Card>
            <Text
              style={[
                styles.privacyLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Sichtbarkeit in Ranglisten
            </Text>
            <View style={styles.privacyOptions}>
              {(["public", "friends", "private"] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.privacyOption,
                    settings.privacyMode === mode && {
                      backgroundColor: theme.colors.primary + "20",
                      borderColor: theme.colors.primary,
                    },
                    { borderColor: theme.colors.border },
                  ]}
                  onPress={() => dispatch(setPrivacyMode(mode))}
                >
                  <Text
                    style={[
                      styles.privacyOptionText,
                      {
                        color:
                          settings.privacyMode === mode
                            ? theme.colors.primary
                            : theme.colors.text,
                      },
                    ]}
                  >
                    {mode === "public"
                      ? "🌍 Öffentlich"
                      : mode === "friends"
                      ? "👥 Freunde"
                      : "🔒 Privat"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        </View>

        {/* Badges Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Alle Badges ({unlockedBadges.length}/{stats.badges.length})
          </Text>

          {unlockedBadges.length > 0 && (
            <>
              <Text
                style={[
                  styles.subsectionTitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Freigeschaltet
              </Text>
              {unlockedBadges.map((badge: Badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </>
          )}

          {lockedBadges.length > 0 && (
            <>
              <Text
                style={[
                  styles.subsectionTitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Noch zu erreichen
              </Text>
              {lockedBadges.map((badge: Badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </>
          )}
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Konto
          </Text>
          <Card style={styles.accountCard}>
            <TouchableOpacity style={styles.accountItem}>
              <Text style={[styles.accountText, { color: theme.colors.text }]}>
                📊 Daten exportieren
              </Text>
              <Text style={{ color: theme.colors.textSecondary }}>→</Text>
            </TouchableOpacity>
            <View
              style={[styles.divider, { backgroundColor: theme.colors.border }]}
            />
            <TouchableOpacity style={styles.accountItem}>
              <Text style={[styles.accountText, { color: theme.colors.text }]}>
                ❓ Hilfe & Support
              </Text>
              <Text style={{ color: theme.colors.textSecondary }}>→</Text>
            </TouchableOpacity>
            <View
              style={[styles.divider, { backgroundColor: theme.colors.border }]}
            />
            <TouchableOpacity style={styles.accountItem}>
              <Text style={[styles.accountText, { color: theme.colors.text }]}>
                📋 Datenschutzrichtlinie
              </Text>
              <Text style={{ color: theme.colors.textSecondary }}>→</Text>
            </TouchableOpacity>
          </Card>

          <Button
            title="Abmelden"
            variant="outline"
            onPress={handleSignOut}
            style={styles.signOutButton}
          />
        </View>

        {/* Version */}
        <Text style={[styles.version, { color: theme.colors.textSecondary }]}>
          FocusFlow v0.0.1
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  userCard: {
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#00d4aa",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  anonymousBadge: {
    backgroundColor: "rgba(128, 128, 128, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  anonymousText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#888",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 8,
  },
  settingsCard: {
    padding: 0,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  bedtimeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  bedtimeTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  bedtimeDescription: {
    fontSize: 14,
  },
  bedtimeTimes: {
    flexDirection: "row",
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  privacyLabel: {
    fontSize: 14,
    marginBottom: 12,
  },
  privacyOptions: {
    flexDirection: "row",
    gap: 8,
  },
  privacyOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  privacyOptionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  accountCard: {
    padding: 0,
  },
  accountItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  accountText: {
    fontSize: 16,
  },
  signOutButton: {
    marginTop: 16,
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 8,
  },
});

export default ProfileScreen;
