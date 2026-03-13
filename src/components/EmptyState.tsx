import React from 'react';
import {View, Text, StyleSheet, ViewStyle} from 'react-native';
import {useTheme} from '../theme/ThemeContext';
import {Button} from './Button';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => {
  const {theme} = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.title, {color: theme.colors.text}]}>
        {title}
      </Text>
      {description && (
        <Text style={[styles.description, {color: theme.colors.textSecondary}]}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    minWidth: 160,
  },
});

export default EmptyState;
