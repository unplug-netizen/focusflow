import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  Animated,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";

interface FloatingActionButtonProps {
  onPress: () => void;
  icon: string;
  style?: ViewStyle;
  size?: "small" | "medium" | "large";
  color?: string;
  animated?: boolean;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onPress,
  icon,
  style,
  size = "medium",
  color,
  animated = false,
}) => {
  const { theme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (animated) {
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        friction: 5,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (animated) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
      }).start();
    }
  };

  const getSize = () => {
    switch (size) {
      case "small":
        return 48;
      case "large":
        return 72;
      default:
        return 56;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "small":
        return 20;
      case "large":
        return 32;
      default:
        return 24;
    }
  };

  const buttonSize = getSize();
  const buttonColor = color || theme.colors.primary;

  const buttonStyle = {
    width: buttonSize,
    height: buttonSize,
    borderRadius: buttonSize / 2,
    backgroundColor: buttonColor,
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        style={[styles.button, buttonStyle]}
      >
        <Text style={[styles.icon, { fontSize: getIconSize() }]}>{icon}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  icon: {
    color: "#fff",
  },
});

export default FloatingActionButton;
