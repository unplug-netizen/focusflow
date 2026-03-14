import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";

export type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationProps {
  visible: boolean;
  type?: NotificationType;
  title?: string;
  message: string;
  onDismiss?: () => void;
  duration?: number;
  style?: ViewStyle;
  actionLabel?: string;
  onAction?: () => void;
}

export const Notification: React.FC<NotificationProps> = ({
  visible,
  type = "info",
  title,
  message,
  onDismiss,
  duration = 3000,
  style,
  actionLabel,
  onAction,
}) => {
  const { theme } = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const getColors = () => {
    switch (type) {
      case "success":
        return {
          background: theme.colors.success,
          icon: "✓",
        };
      case "error":
        return {
          background: theme.colors.error,
          icon: "✕",
        };
      case "warning":
        return {
          background: theme.colors.warning,
          icon: "⚠",
        };
      default:
        return {
          background: theme.colors.primary,
          icon: "ℹ",
        };
    }
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (duration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      handleDismiss();
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  const colors = getColors();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          transform: [{ translateY }],
          opacity,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{colors.icon}</Text>
        <View style={styles.textContainer}>
          {title && <Text style={styles.title}>{title}</Text>}
          <Text style={styles.message}>{message}</Text>
        </View>
        {actionLabel && onAction && (
          <TouchableOpacity onPress={onAction} style={styles.actionButton}>
            <Text style={styles.actionText}>{actionLabel}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
    color: "#fff",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  message: {
    color: "#fff",
    fontSize: 14,
  },
  actionButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 6,
  },
  actionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  closeButton: {
    marginLeft: 12,
    padding: 4,
  },
  closeText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default Notification;
