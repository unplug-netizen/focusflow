import React from 'react';
import {View, Text, StyleSheet, ViewStyle} from 'react-native';
import {useTheme} from '../theme/ThemeContext';

interface ProgressBarProps {
  progress: number; // 0-100
  total?: number;
  showPercentage?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  style?: ViewStyle;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  total = 100,
  showPercentage = true,
  size = 'medium',
  color,
  style,
  label,
}) => {
  const {theme} = useTheme();
  const percentage = Math.min(Math.max((progress / total) * 100, 0), 100);

  const getHeight = () => {
    switch (size) {
      case 'small':
        return 4;
      case 'large':
        return 12;
      default:
        return 8;
    }
  };

  const barColor = color || theme.colors.primary;

  return (
    <View style={[styles.container, style]}>
      {(label || showPercentage) && (
        <View style={styles.header}>
          {label && (
            <Text style={[styles.label, {color: theme.colors.text}]}>
              {label}
            </Text>
          )}
          {showPercentage && (
            <Text style={[styles.percentage, {color: theme.colors.textSecondary}]}>
              {Math.round(percentage)}%
            </Text>
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
        ]}>
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
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
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});

export default ProgressBar;
