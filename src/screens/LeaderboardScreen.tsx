import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../theme/ThemeContext";
import { RootState, AppDispatch } from "../store";
import { Card, Button, LeaderboardItem } from "../components";
import {
  fetchLeaderboard,
  setCategory,
} from "../store/slices/leaderboardSlice";
import { LeaderboardCategory } from "../types";

const CATEGORIES: { key: LeaderboardCategory; label: string; icon: string }[] =
  [
    { key: "screen_time", label: "Bildschirmzeit", icon: "📱" },
    { key: "focus_time", label: "Fokus Zeit", icon: "🎯" },
    { key: "badges", label: "Badges", icon: "🏆" },
    { key: "streak", label: "Streak", icon: "🔥" },
    { key: "weekly_challenge", label: "Wochen-Challenge", icon: "⚡" },
  ];

const MOCK_LEADERBOARD = [
  {
    rank: 1,
    userId: "1",
    displayName: "Sarah M.",
    score: 12500,
    streak: 45,
    isCurrentUser: false,
  },
  {
    rank: 2,
    userId: "2",
    displayName: "Max K.",
    score: 11200,
    streak: 32,
    isCurrentUser: false,
  },
  {
    rank: 3,
    userId: "3",
    displayName: "Lisa B.",
    score: 10800,
    streak: 28,
    isCurrentUser: false,
  },
  {
    rank: 4,
    userId: "4",
    displayName: "Tom H.",
    score: 9500,
    streak: 21,
    isCurrentUser: false,
  },
  {
    rank: 5,
    userId: "5",
    displayName: "Anna S.",
    score: 8900,
    streak: 18,
    isCurrentUser: false,
  },
  {
    rank: 12,
    userId: "current",
    displayName: "Du",
    score: 5400,
    streak: 7,
    isCurrentUser: true,
  },
];

export const LeaderboardScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { entries, category, isLoading } = useSelector(
    (state: RootState) => state.leaderboard
  );
  const stats = useSelector((state: RootState) => state.stats);
  const [refreshing, setRefreshing] = React.useState(false);

  // Use mock data for now
  const displayEntries = entries.length > 0 ? entries : MOCK_LEADERBOARD;

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    dispatch(fetchLeaderboard(category));
    setTimeout(() => setRefreshing(false), 1000);
  }, [dispatch, category]);

  const handleCategoryChange = (newCategory: LeaderboardCategory) => {
    dispatch(setCategory(newCategory));
    dispatch(fetchLeaderboard(newCategory));
  };

  const currentUserEntry = displayEntries.find((e) => e.isCurrentUser);
  const topEntries = displayEntries
    .filter((e) => !e.isCurrentUser)
    .slice(0, 10);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={{ fontSize: 24, color: theme.colors.text }}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Rangliste
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* Category Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryChip,
                {
                  backgroundColor:
                    category === cat.key
                      ? theme.colors.primary
                      : theme.colors.surface,
                },
              ]}
              onPress={() => handleCategoryChange(cat.key)}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: category === cat.key ? "#fff" : theme.colors.text,
                  },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* User Rank Card */}
        {currentUserEntry && (
          <Card style={styles.userRankCard}>
            <View style={styles.userRankHeader}>
              <Text
                style={[styles.userRankTitle, { color: theme.colors.text }]}
              >
                Deine Position
              </Text>
              <View style={styles.userRankBadge}>
                <Text style={styles.userRankBadgeText}>
                  #{currentUserEntry.rank}
                </Text>
              </View>
            </View>
            <View style={styles.userStats}>
              <View style={styles.userStat}>
                <Text
                  style={[
                    styles.userStatValue,
                    { color: theme.colors.primary },
                  ]}
                >
                  {currentUserEntry.score.toLocaleString()}
                </Text>
                <Text
                  style={[
                    styles.userStatLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Punkte
                </Text>
              </View>
              <View style={styles.userStatDivider} />
              <View style={styles.userStat}>
                <Text
                  style={[styles.userStatValue, { color: theme.colors.text }]}
                >
                  🔥 {currentUserEntry.streak}
                </Text>
                <Text
                  style={[
                    styles.userStatLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Tage Streak
                </Text>
              </View>
              <View style={styles.userStatDivider} />
              <View style={styles.userStat}>
                <Text
                  style={[styles.userStatValue, { color: theme.colors.text }]}
                >
                  {stats.focusCoins}
                </Text>
                <Text
                  style={[
                    styles.userStatLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Focus Coins
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Top 3 Podium */}
        <View style={styles.podiumContainer}>
          {topEntries.slice(0, 3).map((entry, index) => {
            const positions = [1, 0, 2]; // 2nd, 1st, 3rd
            const position = positions[index];
            const heights = [120, 150, 100];
            const colors = ["#C0C0C0", "#FFD700", "#CD7F32"];

            return (
              <View key={entry.userId} style={[styles.podiumItem]}>
                <View style={styles.podiumAvatar}>
                  <Text style={styles.podiumAvatarText}>
                    {entry.displayName.charAt(0)}
                  </Text>
                </View>
                <Text
                  style={[styles.podiumName, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {entry.displayName}
                </Text>
                <Text
                  style={[styles.podiumScore, { color: theme.colors.primary }]}
                >
                  {entry.score.toLocaleString()}
                </Text>
                <View
                  style={[
                    styles.podiumBar,
                    {
                      height: heights[index],
                      backgroundColor: colors[index],
                    },
                  ]}
                >
                  <Text style={styles.podiumRank}>
                    {index === 1 ? 1 : index === 0 ? 2 : 3}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Leaderboard List */}
        <View style={styles.listSection}>
          <Text style={[styles.listTitle, { color: theme.colors.text }]}>
            Top 10
          </Text>
          {topEntries.map((entry) => (
            <LeaderboardItem key={entry.userId} entry={entry} />
          ))}
        </View>

        {/* Current User in List */}
        {currentUserEntry && currentUserEntry.rank > 10 && (
          <View style={styles.listSection}>
            <Text style={[styles.listTitle, { color: theme.colors.text }]}>
              Deine Position
            </Text>
            <LeaderboardItem entry={currentUserEntry} />
          </View>
        )}

        {/* Invite Friends */}
        <Card style={styles.inviteCard}>
          <Text style={[styles.inviteTitle, { color: theme.colors.text }]}>
            Freunde einladen
          </Text>
          <Text
            style={[styles.inviteText, { color: theme.colors.textSecondary }]}
          >
            Lade Freunde ein und vergleicht eure Fortschritte! Für jede
            Einladung gibt es 50 Focus Coins.
          </Text>
          <Button
            title="Einladung senden"
            variant="primary"
            size="medium"
            onPress={() => {}}
          />
        </Card>
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  placeholder: {
    width: 40,
  },
  categoryScroll: {
    marginBottom: 20,
  },
  categoryContent: {
    paddingRight: 16,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 8,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  userRankCard: {
    marginBottom: 20,
  },
  userRankHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  userRankTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  userRankBadge: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  userRankBadgeText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 14,
  },
  userStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  userStat: {
    alignItems: "center",
  },
  userStatValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  userStatLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  userStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(128, 128, 128, 0.2)",
  },
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    height: 220,
    marginBottom: 24,
  },
  podiumItem: {
    alignItems: "center",
    marginHorizontal: 8,
    width: 80,
  },
  podiumAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(128, 128, 128, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  podiumAvatarText: {
    fontSize: 20,
    fontWeight: "600",
  },
  podiumName: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  podiumScore: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  podiumBar: {
    width: 60,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 8,
  },
  podiumRank: {
    color: "#000",
    fontSize: 24,
    fontWeight: "700",
  },
  listSection: {
    marginBottom: 24,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  inviteCard: {
    marginTop: 8,
  },
  inviteTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  inviteText: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
});

export default LeaderboardScreen;
