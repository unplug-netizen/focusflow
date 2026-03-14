import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../theme/ThemeContext";
import { RootState } from "../store";
import {
  Card,
  StatCard,
  BadgeCard,
  ProgressBar,
  BarChart,
} from "../components";
import { Badge } from "../types";

export const StatsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const stats = useSelector((state: RootState) => state.stats);
  const { sessions } = useSelector((state: RootState) => state.focusMode);

  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.completed).length;
  const completionRate =
    totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

  const unlockedBadges = stats.badges.filter((b) => b.unlockedAt);
  const lockedBadges = stats.badges.filter((b) => !b.unlockedAt);

  const maxScreenTime = Math.max(...stats.weeklyScreenTime, 1);

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
            Statistiken
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Leaderboard" as never)}
          >
            <Text
              style={[styles.leaderboardLink, { color: theme.colors.primary }]}
            >
              Rangliste →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Overview Stats */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Gesamt Fokus"
            value={`${Math.floor(stats.totalFocusTime / 60)}h`}
            subtitle={`${stats.totalFocusTime % 60} Minuten`}
            icon="🎯"
            progress={Math.min(stats.totalFocusTime / 6000, 100)}
            progressTotal={100}
          />
          <StatCard
            title="Lebenszeit"
            value={`${stats.lifeTimeGained}h`}
            subtitle="Zurückgewonnen"
            icon="⏰"
            trend="up"
            trendValue="+5%"
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            title="Streak"
            value={stats.currentStreak}
            subtitle="Tage am Stück"
            icon="🔥"
            progress={stats.currentStreak}
            progressTotal={30}
          />
          <StatCard
            title="Focus Coins"
            value={stats.focusCoins}
            subtitle="Verdient"
            icon="🪙"
          />
        </View>

        {/* Weekly Screen Time Chart */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Wöchentliche Bildschirmzeit
          </Text>
          <Card>
            <BarChart
              data={stats.weeklyScreenTime}
              maxValue={maxScreenTime}
              color={theme.colors.primary}
              secondaryColor={theme.colors.secondary}
              showValues={false}
            />
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: theme.colors.primary },
                  ]}
                />
                <Text
                  style={[
                    styles.legendText,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Heute
                </Text>
              </View>
              <Text
                style={[
                  styles.averageText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Ø {Math.round(stats.dailyAverage)}m/Tag
              </Text>
            </View>
          </Card>
        </View>

        {/* Focus Sessions Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Fokus-Sitzungen
          </Text>
          <Card>
            <View style={styles.sessionStats}>
              <View style={styles.sessionItem}>
                <Text
                  style={[styles.sessionValue, { color: theme.colors.text }]}
                >
                  {totalSessions}
                </Text>
                <Text
                  style={[
                    styles.sessionLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Gesamt
                </Text>
              </View>
              <View style={styles.sessionDivider} />
              <View style={styles.sessionItem}>
                <Text
                  style={[styles.sessionValue, { color: theme.colors.success }]}
                >
                  {completedSessions}
                </Text>
                <Text
                  style={[
                    styles.sessionLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Abgeschlossen
                </Text>
              </View>
              <View style={styles.sessionDivider} />
              <View style={styles.sessionItem}>
                <Text
                  style={[styles.sessionValue, { color: theme.colors.primary }]}
                >
                  {Math.round(completionRate)}%
                </Text>
                <Text
                  style={[
                    styles.sessionLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Erfolgsrate
                </Text>
              </View>
            </View>
            <View style={styles.completionBar}>
              <ProgressBar
                progress={completionRate}
                showPercentage={false}
                color={theme.colors.success}
              />
            </View>
          </Card>
        </View>

        {/* Badges Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Badges
            </Text>
            <Text
              style={[styles.badgeCount, { color: theme.colors.textSecondary }]}
            >
              {unlockedBadges.length}/{stats.badges.length}
            </Text>
          </View>

          {/* Unlocked Badges */}
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

          {/* Locked Badges */}
          {lockedBadges.length > 0 && (
            <>
              <Text
                style={[
                  styles.subsectionTitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                In Arbeit
              </Text>
              {lockedBadges.slice(0, 3).map((badge: Badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
              {lockedBadges.length > 3 && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => navigation.navigate("Profile" as never)}
                >
                  <Text
                    style={[
                      styles.showMoreText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    +{lockedBadges.length - 3} weitere anzeigen
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Monthly Progress */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Monatlicher Fortschritt
          </Text>
          <Card>
            <View style={styles.monthlyStats}>
              <View style={styles.monthlyItem}>
                <Text
                  style={[styles.monthlyValue, { color: theme.colors.text }]}
                >
                  {stats.longestStreak}
                </Text>
                <Text
                  style={[
                    styles.monthlyLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Längster Streak
                </Text>
              </View>
              <View style={styles.monthlyItem}>
                <Text
                  style={[styles.monthlyValue, { color: theme.colors.text }]}
                >
                  {Math.floor(stats.totalBlockedTime / 60)}h
                </Text>
                <Text
                  style={[
                    styles.monthlyLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Blockierte Zeit
                </Text>
              </View>
            </View>
          </Card>
        </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  leaderboardLink: {
    fontSize: 16,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  badgeCount: {
    fontSize: 14,
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
  averageText: {
    fontSize: 12,
  },
  sessionStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  sessionItem: {
    alignItems: "center",
  },
  sessionValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  sessionLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  sessionDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(128, 128, 128, 0.2)",
  },
  completionBar: {
    marginTop: 20,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 8,
  },
  showMoreButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: "500",
  },
  monthlyStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  monthlyItem: {
    alignItems: "center",
  },
  monthlyValue: {
    fontSize: 32,
    fontWeight: "700",
  },
  monthlyLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default StatsScreen;
