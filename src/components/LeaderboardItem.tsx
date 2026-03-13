import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useTheme} from '../theme/ThemeContext';
import {LeaderboardEntry} from '../types';
import Card from './Card';

interface LeaderboardItemProps {
  entry: LeaderboardEntry;
  onPress?: () => void;
}

export const LeaderboardItem: React.FC<LeaderboardItemProps> = ({
  entry,
  onPress,
}) => {
  const {theme} = useTheme();

  const getRankStyle = () => {
    switch (entry.rank) {
      case 1:
        return {backgroundColor: '#FFD700', color: '#000'};
      case 2:
        return {backgroundColor: '#C0C0C0', color: '#000'};
      case 3:
        return {backgroundColor: '#CD7F32', color: '#fff'};
      default:
        return {
          backgroundColor: theme.colors.border,
          color: theme.colors.text,
        };
    }
  };

  const rankStyle = getRankStyle();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card
        style={entry.isCurrentUser ? [styles.container, {borderWidth: 2, borderColor: theme.colors.primary}] : styles.container}>
        <View style={styles.rankContainer}>
          <View
            style={[
              styles.rankBadge,
              {backgroundColor: rankStyle.backgroundColor},
            ]}>
            <Text style={[styles.rankText, {color: rankStyle.color}]}>
              {entry.rank}
            </Text>
          </View>
        </View>

        <View style={styles.avatarContainer}>
          {entry.photoURL ? (
            <View style={[styles.avatar, {backgroundColor: theme.colors.primary}]}>
              <Text style={styles.avatarText}>
                {entry.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          ) : (
            <View
              style={[styles.avatar, {backgroundColor: theme.colors.border}]}>
              <Text style={[styles.avatarText, {color: theme.colors.text}]}>
                {entry.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={[styles.name, {color: theme.colors.text}]}>
            {entry.displayName}
            {entry.isCurrentUser && (
              <Text style={[styles.youBadge, {color: theme.colors.primary}]}>
                {' '}
                (Du)
              </Text>
            )}
          </Text>
          <Text style={[styles.streak, {color: theme.colors.textSecondary}]}>
            🔥 {entry.streak} Tage Streak
          </Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={[styles.score, {color: theme.colors.primary}]}>
            {entry.score.toLocaleString()}
          </Text>
          <Text style={[styles.scoreLabel, {color: theme.colors.textSecondary}]}>
            Punkte
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 12,
  },
  rankContainer: {
    marginRight: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  youBadge: {
    fontSize: 12,
    fontWeight: '500',
  },
  streak: {
    fontSize: 12,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  score: {
    fontSize: 18,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 11,
  },
});

export default LeaderboardItem;
