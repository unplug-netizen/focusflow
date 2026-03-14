import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, ViewStyle, Animated } from "react-native";
import { useTheme } from "../theme/ThemeContext";

interface ProgressBarProps {
  progress: number; // 0-100 or 0-total
  total?: number;
  showPercentage?: boolean;
  size?: "small" | "medium" | "large";
  color?: string;
  style?: ViewStyle;
  label?: string;
  animated?: boolean;
  showSteps?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  total = 100,
  showPercentage = true,
  size = "medium",
  color,
  style,
  label,
  animated = true,
  showSteps = false,
}) => {
  const { theme } = useTheme();
  const percentage = Math.min(Math.max((progress / total) * 100, 0), 100);
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.spring(animValue, {
        toValue: percentage,
        useNativeDriver: false,
        friction: 8,
        tension: 40,
      }).start();
    } else {
      animValue.setValue(percentage);
    }
  }, [percentage, animated]);

  const [animatedWidth, setAnimatedWidth] = React.useState<number>(percentage);

  useEffect(() => {
    const listener = animValue.addListener(({ value }) => {
      setAnimatedWidth(value);
    });
    return () => animValue.removeListener(listener);
  }, [animValue]);

  const getHeight = () => {
    switch (size) {
      case "small":
        return 4;
      case "large":
        return 12;
      default:
        return 8;
    }
  };

  const barColor = color || theme.colors.primary;

  return (
    <View style={[styles.container, style]}>
      {(label || showPercentage || showSteps) && (
        <View style={styles.header}>
          {label && (
            <Text style={[styles.label, { color: theme.colors.text }]}>
              {label}
            </Text>
          )}
          {showSteps ? (
            <Text
              style={[styles.percentage, { color: theme.colors.textSecondary }]}
            >
              {Math.round(progress)}/{total}
            </Text>
          ) : (
            showPercentage && (
              <Text
                style={[
                  styles.percentage,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {Math.round(percentage)}%
              </Text>
            )
          )}
        </View>
      )}
      <View
        style={[
          styles.track,
          {
            backgroundColor: theme.colors.border,
            height: getHeight(),
            borderRadius: getHeight() / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              width: `${animatedWidth}%`,
              backgroundColor: barColor,
              borderRadius: getHeight() / 2,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  percentage: {
    fontSize: 14,
    fontWeight: "600",
  },
  track: {
    width: "100%",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});

export default ProgressBar;
