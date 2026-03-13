import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import {useTheme} from '../theme/ThemeContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: {
    icon?: string;
    label?: string;
    onPress: () => void;
  };
  style?: ViewStyle;
  showBack?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightAction,
  style,
  showBack = false,
}) => {
  const {theme} = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftContainer}>
        {(showBack || onBack) && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={[styles.backIcon, {color: theme.colors.text}]}>
              ←
            </Text>
          </TouchableOpacity>
        )}
        <View>
          <Text style={[styles.title, {color: theme.colors.text}]}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightAction && (
        <TouchableOpacity
          onPress={rightAction.onPress}
          style={styles.rightButton}>
          {rightAction.icon && (
            <Text style={styles.rightIcon}>{rightAction.icon}</Text>
          )}
          {rightAction.label && (
            <Text
              style={[styles.rightLabel, {color: theme.colors.primary}]}>
              {rightAction.label}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  backIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  rightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  rightIcon: {
    fontSize: 20,
    marginRight: 4,
  },
  rightLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Header;
