import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ViewStyle} from 'react-native';
import {useTheme} from '../theme/ThemeContext';

interface TimerProps {
  timeRemaining: number; // in seconds
  totalTime: number;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
  style?: ViewStyle;
  label?: string;
}

export const Timer: React.FC<TimerProps> = ({
  timeRemaining,
  totalTime,
  size = 'large',
  showProgress = true,
  style,
  label,
}) => {
  const {theme} = useTheme();
  const [displayTime, setDisplayTime] = useState(timeRemaining);

  useEffect(() => {
    setDisplayTime(timeRemaining);
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'medium':
        return 48;
      case 'large':
        return 72;
      default:
        return 48;
    }
  };

  const getStrokeWidth = () => {
    switch (size) {
      case 'small':
        return 4;
      case 'medium':
        return 8;
      case 'large':
        return 12;
      default:
        return 8;
    }
  };

  const progress = totalTime > 0 ? (timeRemaining / totalTime) : 0;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={[styles.container, style]}>
      {showProgress ? (
        <View style={styles.progressContainer}>
          <View style={styles.svgContainer}>
            <View
              style={[
                styles.circleTrack,
                {
                  width: getStrokeWidth() * 10,
                  height: getStrokeWidth() * 10,
                  borderRadius: (getStrokeWidth() * 10) / 2,
                  borderWidth: getStrokeWidth(),
                  borderColor: theme.colors.border,
                },
              ]}
            />
            <View
              style={[
                styles.circleProgress,
                {
                  width: getStrokeWidth() * 10,
                  height: getStrokeWidth() * 10,
                  borderRadius: (getStrokeWidth() * 10) / 2,
                  borderWidth: getStrokeWidth(),
                  borderColor: theme.colors.primary,
                  borderTopColor: 'transparent',
                  borderRightColor: 'transparent',
                  transform: [
                    {rotate: `${-90 + (1 - progress) * 360}deg`},
                  ],
                },
              ]}
            />
          </View>
          <Text
            style={[
              styles.timeText,
              {
                color: theme.colors.text,
                fontSize: getFontSize(),
              },
            ]}>
            {formatTime(displayTime)}
          </Text>
        </View>
      ) : (
        <Text
          style={[
            styles.timeText,
            {
              color: theme.colors.text,
              fontSize: getFontSize(),
            },
          ]}>
          {formatTime(displayTime)}
        </Text>
      )}
      {label && (
        <Text style={[styles.label, {color: theme.colors.textSecondary}]}>
          {label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleTrack: {
    position: 'absolute',
  },
  circleProgress: {
    position: 'absolute',
  },
  timeText: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: 14,
    marginTop: 8,
  },
});

export default Timer;
