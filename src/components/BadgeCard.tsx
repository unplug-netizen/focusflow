import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { Badge } from "../types";
import Card from "./Card";
import ProgressBar from "./ProgressBar";

interface BadgeCardProps {
  badge: Badge;
  onPress?: () => void;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ badge, onPress }) => {
  const { theme } = useTheme();

  const getTierColor = () => {
    switch (badge.tier) {
      case "bronze":
        return "#cd7f32";
      case "silver":
        return "#c0c0c0";
      case "gold":
        return "#ffd700";
      case "platinum":
        return "#e5e4e2";
      default:
        return theme.colors.primary;
    }
  };

  const isUnlocked = !!badge.unlockedAt;

  return (
    <Card
      style={!isUnlocked ? [styles.container, styles.locked] : styles.container}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: getTierColor() + "20" },
          ]}
        >
          <Text style={styles.icon}>{badge.icon}</Text>
        </View>
        <View style={styles.tierBadge}>
          <Text style={[styles.tierText, { color: getTierColor() }]}>
            {badge.tier.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={[styles.name, { color: theme.colors.text }]}>
        {badge.name}
      </Text>
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        {badge.description}
      </Text>
      {isUnlocked ? (
        <View style={styles.unlockedContainer}>
          <Text style={[styles.unlockedText, { color: theme.colors.success }]}>
            ✓ Freigeschaltet
          </Text>
          <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
            {badge.unlockedAt?.toLocaleDateString("de-DE")}
          </Text>
        </View>
      ) : (
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={badge.progress}
            total={badge.maxProgress}
            size="small"
            showPercentage={false}
            color={getTierColor()}
          />
          <Text
            style={[styles.progressText, { color: theme.colors.textSecondary }]}
          >
            {badge.progress} / {badge.maxProgress}
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  locked: {
    opacity: 0.7,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 24,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tierText: {
    fontSize: 10,
    fontWeight: "700",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
  },
  unlockedContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  unlockedText: {
    fontSize: 14,
    fontWeight: "600",
  },
  date: {
    fontSize: 12,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "right",
  },
});

export default BadgeCard;
