import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../theme/ThemeContext";

interface TimerProps {
  timeRemaining: number; // in seconds
  totalTime: number;
  size?: "small" | "medium" | "large";
  showProgress?: boolean;
  style?: ViewStyle;
  label?: string;
  color?: string;
  animated?: boolean;
}

export const Timer: React.FC<TimerProps> = ({
  timeRemaining,
  totalTime,
  size = "large",
  showProgress = true,
  style,
  label,
  color,
}) => {
  const { theme } = useTheme();
  const [displayTime, setDisplayTime] = useState(timeRemaining);

  useEffect(() => {
    setDisplayTime(timeRemaining);
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getFontSize = () => {
    switch (size) {
      case "small":
        return 24;
      case "medium":
        return 48;
      case "large":
        return 72;
      default:
        return 48;
    }
  };

  const getStrokeWidth = () => {
    switch (size) {
      case "small":
        return 4;
      case "medium":
        return 8;
      case "large":
        return 12;
      default:
        return 8;
    }
  };

  const getContainerSize = () => {
    switch (size) {
      case "small":
        return 100;
      case "medium":
        return 180;
      case "large":
        return 260;
      default:
        return 180;
    }
  };

  const progress = totalTime > 0 ? timeRemaining / totalTime : 0;
  const timerColor = color || theme.colors.primary;
  const containerSize = getContainerSize();
  const strokeWidth = getStrokeWidth();
  const radius = (containerSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={[styles.container, style]}>
      {showProgress ? (
        <View
          style={[
            styles.progressContainer,
            { width: containerSize, height: containerSize },
          ]}
        >
          {/* SVG-like Circle Progress using View borders */}
          <View
            style={[
              styles.circleContainer,
              { width: containerSize, height: containerSize },
            ]}
          >
            {/* Background Circle */}
            <View
              style={[
                styles.circleTrack,
                {
                  width: containerSize,
                  height: containerSize,
                  borderRadius: containerSize / 2,
                  borderWidth: strokeWidth,
                  borderColor: theme.colors.border,
                },
              ]}
            />
            {/* Progress Arc - Using a rotated view approach */}
            <View
              style={[
                styles.progressArc,
                {
                  width: containerSize,
                  height: containerSize,
                  borderRadius: containerSize / 2,
                  borderWidth: strokeWidth,
                  borderColor: timerColor,
                  borderTopColor: progress > 0.75 ? timerColor : "transparent",
                  borderRightColor: progress > 0.5 ? timerColor : "transparent",
                  borderBottomColor:
                    progress > 0.25 ? timerColor : "transparent",
                  transform: [{ rotate: `${-90 + (1 - progress) * 360}deg` }],
                },
              ]}
            />
          </View>
          {/* Time Display */}
          <View style={styles.timeContainer}>
            <Text
              style={[
                styles.timeText,
                {
                  color: theme.colors.text,
                  fontSize: getFontSize(),
                },
              ]}
            >
              {formatTime(displayTime)}
            </Text>
          </View>
        </View>
      ) : (
        <Text
          style={[
            styles.timeText,
            {
              color: theme.colors.text,
              fontSize: getFontSize(),
            },
          ]}
        >
          {formatTime(displayTime)}
        </Text>
      )}
      {label && (
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          {label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  progressContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  circleContainer: {
    position: "absolute",
  },
  circleTrack: {
    position: "absolute",
  },
  progressArc: {
    position: "absolute",
  },
  timeContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: {
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  label: {
    fontSize: 14,
    marginTop: 12,
  },
});

export default Timer;
