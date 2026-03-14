import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../theme/ThemeContext";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  padding?: "none" | "small" | "medium" | "large";
  elevation?: "none" | "small" | "medium" | "large";
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = "medium",
  elevation = "small",
}) => {
  const { theme } = useTheme();

  const getPadding = () => {
    switch (padding) {
      case "none":
        return 0;
      case "small":
        return 12;
      case "large":
        return 24;
      default:
        return 16;
    }
  };

  const getElevation = () => {
    switch (elevation) {
      case "none":
        return {
          shadowOpacity: 0,
          elevation: 0,
        };
      case "small":
        return {
          shadowOpacity: 0.1,
          elevation: 2,
        };
      case "medium":
        return {
          shadowOpacity: 0.15,
          elevation: 4,
        };
      case "large":
        return {
          shadowOpacity: 0.2,
          elevation: 8,
        };
      default:
        return {
          shadowOpacity: 0.1,
          elevation: 2,
        };
    }
  };

  const elevationStyles = getElevation();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          padding: getPadding(),
          shadowColor: theme.dark ? "#000" : "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 4,
          ...elevationStyles,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
  },
});

export default Card;
