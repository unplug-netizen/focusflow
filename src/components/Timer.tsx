import React, {useEffect, useState, useMemo} from 'react';
import {View, Text, StyleSheet, ViewStyle, Animated} from 'react-native';
import {useTheme} from '../theme/ThemeContext';

interface TimerProps {
  timeRemaining: number; // in seconds
  totalTime: number;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
  style?: ViewStyle;
  label?: string;
  color?: string;
  animated?: boolean;
}

export const Timer: React.FC<TimerProps> = ({
  timeRemaining,
  totalTime,
  size = 'large',
  showProgress = true,
  style,
  label,
  color,
  animated = true,
}) => {
  const {theme} = useTheme();
  const [displayTime, setDisplayTime] = useState(timeRemaining);
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setDisplayTime(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    const progress = totalTime > 0 ? timeRemaining / totalTime : 0;
    if (animated) {
      Animated.spring(progressAnim, {
        toValue: progress,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();
    } else {
      progressAnim.setValue(progress);
    }
  }, [timeRemaining, totalTime, animated]);

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

  const getContainerSize = () => {
    switch (size) {
      case 'small':
        return 100;
      case 'medium':
        return 180;
      case 'large':
        return 260;
      default:
        return 180;
    }
  };

  const progress = totalTime > 0 ? (timeRemaining / totalTime) : 0;
  const timerColor = color || theme.colors.primary;
  const containerSize = getContainerSize();
  const strokeWidth = getStrokeWidth();
  const radius = (containerSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Animated stroke offset
  const [animatedOffset, setAnimatedOffset] = useState(circumference * (1 - progress));
  
  useEffect(() => {
    const listener = progressAnim.addListener(({value}) => {
      setAnimatedOffset(circumference * (1 - value));
    });
    return () => progressAnim.removeListener(listener);
  }, [circumference]);

  return (
    <View style={[styles.container, style]}>
      {showProgress ? (
        <View style={[styles.progressContainer, {width: containerSize, height: containerSize}]}>
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
          {/* Progress Circle using border trick */}
          <View
            style={[
              styles.circleProgress,
              {
                width: containerSize,
                height: containerSize,
                borderRadius: containerSize / 2,
                borderWidth: strokeWidth,
                borderColor: timerColor,
                borderTopColor: 'transparent',
                borderRightColor: progress < 0.75 ? 'transparent' : timerColor,
                transform: [
                  {rotate: `${-90 + (1 - progress) * 360}deg`},
                ],
              },
            ]}
          />
          {/* Time Display */}
          <View style={styles.timeContainer}>
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
  circleTrack: {
    position: 'absolute',
  },
  circleProgress: {
    position: 'absolute',
  },
  timeContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: 14,
    marginTop: 12,
  },
});

export default Timer;
