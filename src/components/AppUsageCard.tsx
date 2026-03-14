import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { AppUsage } from "../types";
import Card from "./Card";
import ProgressBar from "./ProgressBar";

interface AppUsageCardProps {
  app: AppUsage;
  onToggleBlock?: () => void;
  onPress?: () => void;
}

export const AppUsageCard: React.FC<AppUsageCardProps> = ({
  app,
  onToggleBlock,
  onPress,
}) => {
  const { theme } = useTheme();

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getCategoryIcon = () => {
    switch (app.category) {
      case "social":
        return "💬";
      case "entertainment":
        return "🎬";
      case "productivity":
        return "💼";
      case "communication":
        return "📞";
      case "games":
        return "🎮";
      case "shopping":
        return "🛍️";
      default:
        return "📱";
    }
  };

  const progress = app.dailyLimit ? (app.usageTime / app.dailyLimit) * 100 : 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card
        style={
          app.isBlocked ? [styles.container, styles.blocked] : styles.container
        }
      >
        <View style={styles.header}>
          <View style={styles.appInfo}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.primary + "20" },
              ]}
            >
              <Text style={styles.icon}>{getCategoryIcon()}</Text>
            </View>
            <View>
              <Text style={[styles.appName, { color: theme.colors.text }]}>
                {app.appName}
              </Text>
              <Text
                style={[styles.category, { color: theme.colors.textSecondary }]}
              >
                {app.category}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onToggleBlock}
            style={[
              styles.blockButton,
              {
                backgroundColor: app.isBlocked
                  ? theme.colors.error + "20"
                  : theme.colors.success + "20",
              },
            ]}
          >
            <Text
              style={[
                styles.blockButtonText,
                {
                  color: app.isBlocked
                    ? theme.colors.error
                    : theme.colors.success,
                },
              ]}
            >
              {app.isBlocked ? "🔒" : "🔓"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.usageContainer}>
          <View style={styles.usageInfo}>
            <Text style={[styles.usageTime, { color: theme.colors.text }]}>
              {formatTime(app.usageTime)}
            </Text>
            {app.dailyLimit && (
              <Text
                style={[styles.limit, { color: theme.colors.textSecondary }]}
              >
                / {formatTime(app.dailyLimit)}
              </Text>
            )}
          </View>
          {app.dailyLimit && (
            <ProgressBar
              progress={app.usageTime}
              total={app.dailyLimit}
              size="small"
              showPercentage={false}
              color={progress > 90 ? theme.colors.error : theme.colors.primary}
            />
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  blocked: {
    opacity: 0.7,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  appInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  appName: {
    fontSize: 16,
    fontWeight: "600",
  },
  category: {
    fontSize: 12,
    textTransform: "capitalize",
  },
  blockButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  blockButtonText: {
    fontSize: 18,
  },
  usageContainer: {
    marginTop: 4,
  },
  usageInfo: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  usageTime: {
    fontSize: 20,
    fontWeight: "700",
  },
  limit: {
    fontSize: 14,
    marginLeft: 4,
  },
});

export default AppUsageCard;
