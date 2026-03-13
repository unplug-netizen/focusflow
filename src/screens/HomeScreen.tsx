import React, {useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '../theme/ThemeContext';
import {RootState} from '../store';
import {Card, StatCard, Button, ProgressBar, FloatingActionButton} from '../components';
import {incrementStreak, addFocusCoins} from '../store/slices/statsSlice';

export const HomeScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {user} = useSelector((state: RootState) => state.auth);
  const {totalFocusTime, focusCoins, currentStreak, badges} = useSelector((state: RootState) => state.stats);
  const {timer} = useSelector((state: RootState) => state.focusMode);
  const {rules} = useSelector((state: RootState) => state.appBlocker);

  const activeRules = rules.filter(r => r.isActive).length;
  const dailyGoal = 120; // 2 hours in minutes
  const dailyProgress = Math.min((totalFocusTime / dailyGoal) * 100, 100);

  const handleQuickFocus = useCallback(() => {
    navigation.navigate('Focus' as never);
  }, [navigation]);

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, {color: theme.colors.textSecondary}]}>
              Willkommen zurück,
            </Text>
            <Text style={[styles.name, {color: theme.colors.text}]}>
              {user?.displayName || 'Focus User'}
            </Text>
          </View>
          <TouchableOpacity style={styles.coinsContainer}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={[styles.coins, {color: theme.colors.primary}]}>
              {focusCoins}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Daily Goal Card */}
        <Card style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={[styles.goalTitle, {color: theme.colors.text}]}>
              Tagesziel
            </Text>
            <Text
              style={[styles.goalValue, {color: theme.colors.textSecondary}]}>
              {Math.floor(totalFocusTime / 60)}h{' '}
              {totalFocusTime % 60}m / 2h
            </Text>
          </View>
          <ProgressBar progress={dailyProgress} showPercentage={false} />
          <Text
            style={[styles.goalSubtitle, {color: theme.colors.textSecondary}]}>
            Noch {Math.max(0, dailyGoal - totalFocusTime)} Minuten bis zum
            Ziel
          </Text>
        </Card>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {backgroundColor: theme.colors.primary + '20'},
            ]}
            onPress={() => navigation.navigate('Focus' as never)}>
            <Text style={styles.actionIcon}>🎯</Text>
            <Text style={[styles.actionText, {color: theme.colors.primary}]}>
              Fokus
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {backgroundColor: theme.colors.error + '20'},
            ]}
            onPress={() => navigation.navigate('Blocker' as never)}>
            <Text style={styles.actionIcon}>🚫</Text>
            <Text style={[styles.actionText, {color: theme.colors.error}]}>
              Blocker
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {backgroundColor: theme.colors.warning + '20'},
            ]}
            onPress={() => navigation.navigate('Stats' as never)}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={[styles.actionText, {color: theme.colors.warning}]}>
              Stats
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
          Deine Statistiken
        </Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Fokus Zeit"
            value={`${Math.floor(totalFocusTime / 60)}h`}
            subtitle={`${totalFocusTime % 60}m heute`}
            icon="🎯"
            trend="up"
            trendValue="+12%"
          />
          <StatCard
            title="Streak"
            value={currentStreak}
            subtitle="Tage am Stück"
            icon="🔥"
            progress={currentStreak}
            progressTotal={30}
          />
        </View>

        {/* Active Blocks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
              Aktive Sperren
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Blocker' as never)}>
              <Text
                style={[styles.seeAll, {color: theme.colors.primary}]}>
                Alle anzeigen
              </Text>
            </TouchableOpacity>
          </View>
          <Card>
            <View style={styles.blockInfo}>
              <Text style={[styles.blockCount, {color: theme.colors.text}]}>
                {activeRules} Apps
              </Text>
              <Text
                style={[
                  styles.blockLabel,
                  {color: theme.colors.textSecondary},
                ]}>
                werden derzeit blockiert
              </Text>
            </View>
            <Button
              title="Blocker verwalten"
              variant="outline"
              size="small"
              onPress={() => navigation.navigate('Blocker' as never)}
            />
          </Card>
        </View>

        {/* Current Timer Status */}
        {timer.status !== 'idle' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
              Aktiver Timer
            </Text>
            <Card>
              <View style={styles.timerInfo}>
                <View>
                  <Text
                    style={[styles.timerMode, {color: theme.colors.text}]}>
                    {timer.mode === 'pomodoro'
                      ? '🍅 Pomodoro'
                      : timer.mode === 'shortBreak'
                      ? '☕ Kurze Pause'
                      : '🌴 Lange Pause'}
                  </Text>
                  <Text
                    style={[
                      styles.timerStatus,
                      {color: theme.colors.textSecondary},
                    ]}>
                    {timer.status === 'running'
                      ? 'Läuft...'
                      : timer.status === 'paused'
                      ? 'Pausiert'
                      : 'Abgeschlossen'}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.timerTime,
                    {color: theme.colors.primary},
                  ]}>
                  {Math.floor(timer.timeRemaining / 60)}:
                  {(timer.timeRemaining % 60).toString().padStart(2, '0')}
                </Text>
              </View>
            </Card>
          </View>
        )}

        {/* Badges Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
              Letzte Badges
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile' as never)}>
              <Text
                style={[styles.seeAll, {color: theme.colors.primary}]}>
                Alle anzeigen
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.badgesScroll}>
            {badges
              .filter(b => b.unlockedAt)
              .slice(0, 5)
              .map(badge => (
                <View
                  key={badge.id}
                  style={[
                    styles.badgeItem,
                    {backgroundColor: theme.colors.surface},
                  ]}>
                  <Text style={styles.badgeIcon}>{badge.icon}</Text>
                  <Text
                    style={[styles.badgeName, {color: theme.colors.text}]}
                    numberOfLines={1}>
                    {badge.name}
                  </Text>
                </View>
              ))}
          </ScrollView>
        </View>

        {/* Bottom padding for FAB */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <FloatingActionButton
          icon="🎯"
          onPress={handleQuickFocus}
          size="large"
          animated
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
  },
  coinsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  coinIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  coins: {
    fontSize: 16,
    fontWeight: '700',
  },
  goalCard: {
    marginBottom: 20,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  goalValue: {
    fontSize: 14,
  },
  goalSubtitle: {
    fontSize: 12,
    marginTop: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  blockInfo: {
    marginBottom: 12,
  },
  blockCount: {
    fontSize: 24,
    fontWeight: '700',
  },
  blockLabel: {
    fontSize: 14,
  },
  timerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerMode: {
    fontSize: 16,
    fontWeight: '600',
  },
  timerStatus: {
    fontSize: 14,
    marginTop: 4,
  },
  timerTime: {
    fontSize: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  badgesScroll: {
    flexDirection: 'row',
  },
  badgeItem: {
    width: 80,
    height: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 80,
  },
  fabContainer: {
    position: 'absolute',
    right: 24,
    bottom: 100,
  },
});

export default HomeScreen;
