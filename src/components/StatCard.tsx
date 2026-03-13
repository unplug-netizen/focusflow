import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../theme/ThemeContext';
import Card from './Card';
import ProgressBar from './ProgressBar';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  progress?: number;
  progressTotal?: number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  progress,
  progressTotal = 100,
  trend,
  trendValue,
}) => {
  const {theme} = useTheme();

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return theme.colors.success;
      case 'down':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, {color: theme.colors.textSecondary}]}>
          {title}
        </Text>
        {icon && <Text style={styles.icon}>{icon}</Text>}
      </View>
      <Text style={[styles.value, {color: theme.colors.text}]}>{value}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
          {subtitle}
        </Text>
      )}
      {progress !== undefined && (
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={progress}
            total={progressTotal}
            size="small"
            showPercentage={false}
          />
        </View>
      )}
      {trend && trendValue && (
        <View style={styles.trendContainer}>
          <Text style={[styles.trendIcon, {color: getTrendColor()}]}>
            {getTrendIcon()}
          </Text>
          <Text style={[styles.trendValue, {color: getTrendColor()}]}>
            {trendValue}
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 140,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  icon: {
    fontSize: 20,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
  },
  progressContainer: {
    marginTop: 12,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  trendIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  trendValue: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default StatCard;
