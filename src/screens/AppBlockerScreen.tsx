import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useTheme} from '../theme/ThemeContext';
import {RootState, AppDispatch} from '../store';
import {Card, Button, Input, AppUsageCard} from '../components';
import {
  addRule,
  updateRule,
  deleteRule,
  toggleRule,
  setAppUsages,
} from '../store/slices/appBlockerSlice';
import {BlockRule, AppUsage, AppCategory} from '../types';

const MOCK_APPS: AppUsage[] = [
  {
    packageName: 'com.instagram.android',
    appName: 'Instagram',
    usageTime: 45,
    dailyLimit: 60,
    isBlocked: false,
    category: 'social',
  },
  {
    packageName: 'com.whatsapp',
    appName: 'WhatsApp',
    usageTime: 120,
    dailyLimit: 180,
    isBlocked: false,
    category: 'communication',
  },
  {
    packageName: 'com.youtube.android',
    appName: 'YouTube',
    usageTime: 90,
    dailyLimit: 120,
    isBlocked: true,
    category: 'entertainment',
  },
  {
    packageName: 'com.tiktok.android',
    appName: 'TikTok',
    usageTime: 30,
    dailyLimit: 30,
    isBlocked: true,
    category: 'social',
  },
  {
    packageName: 'com.spotify.music',
    appName: 'Spotify',
    usageTime: 180,
    isBlocked: false,
    category: 'entertainment',
  },
  {
    packageName: 'com.android.chrome',
    appName: 'Chrome',
    usageTime: 60,
    dailyLimit: 120,
    isBlocked: false,
    category: 'productivity',
  },
];

const CATEGORIES: {key: AppCategory; label: string; icon: string}[] = [
  {key: 'social', label: 'Social Media', icon: '💬'},
  {key: 'entertainment', label: 'Unterhaltung', icon: '🎬'},
  {key: 'games', label: 'Spiele', icon: '🎮'},
  {key: 'shopping', label: 'Shopping', icon: '🛍️'},
  {key: 'communication', label: 'Kommunikation', icon: '📞'},
  {key: 'productivity', label: 'Produktivität', icon: '💼'},
  {key: 'other', label: 'Sonstige', icon: '📱'},
];

export const AppBlockerScreen: React.FC = () => {
  const {theme} = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const {rules, appUsages} = useSelector((state: RootState) => state.appBlocker);
  const [selectedCategory, setSelectedCategory] = useState<AppCategory | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize mock data if empty
  React.useEffect(() => {
    if (appUsages.length === 0) {
      dispatch(setAppUsages(MOCK_APPS));
    }
  }, [dispatch, appUsages.length]);

  const filteredApps = appUsages.filter(app => {
    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
    const matchesSearch = app.appName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleToggleBlock = (packageName: string) => {
    const app = appUsages.find(a => a.packageName === packageName);
    if (app) {
      dispatch(
        setAppUsages(
          appUsages.map(a =>
            a.packageName === packageName ? {...a, isBlocked: !a.isBlocked} : a
          )
        )
      );
    }
  };

  const handleAddRule = (app: AppUsage) => {
    const newRule: BlockRule = {
      id: Date.now().toString(),
      packageName: app.packageName,
      appName: app.appName,
      type: 'limit',
      dailyLimit: app.dailyLimit || 30,
      isActive: true,
      createdAt: new Date(),
    };
    dispatch(addRule(newRule));
    setShowAddModal(false);
  };

  const blockedCount = appUsages.filter(a => a.isBlocked).length;
  const totalScreenTime = appUsages.reduce((sum, app) => sum + app.usageTime, 0);

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, {color: theme.colors.text}]}>
            App Blocker
          </Text>
          <TouchableOpacity
            style={[
              styles.addButton,
              {backgroundColor: theme.colors.primary},
            ]}
            onPress={() => setShowAddModal(true)}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Card */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text
                style={[styles.summaryValue, {color: theme.colors.text}]}>
                {blockedCount}
              </Text>
              <Text
                style={[
                  styles.summaryLabel,
                  {color: theme.colors.textSecondary},
                ]}>
                Blockiert
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text
                style={[styles.summaryValue, {color: theme.colors.text}]}>
                {Math.floor(totalScreenTime / 60)}h {totalScreenTime % 60}m
              </Text>
              <Text
                style={[
                  styles.summaryLabel,
                  {color: theme.colors.textSecondary},
                ]}>
                Bildschirmzeit
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text
                style={[styles.summaryValue, {color: theme.colors.text}]}>
                {rules.length}
              </Text>
              <Text
                style={[
                  styles.summaryLabel,
                  {color: theme.colors.textSecondary},
                ]}>
                Regeln
              </Text>
            </View>
          </View>
        </Card>

        {/* Search */}
        <Input
          placeholder="Apps durchsuchen..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
        />

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}>
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === 'all' && {
                backgroundColor: theme.colors.primary,
              },
              {backgroundColor: theme.colors.surface},
            ]}
            onPress={() => setSelectedCategory('all')}>
            <Text
              style={[
                styles.categoryText,
                {
                  color:
                    selectedCategory === 'all'
                      ? '#fff'
                      : theme.colors.text,
                },
              ]}>
              Alle
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryChip,
                selectedCategory === cat.key && {
                  backgroundColor: theme.colors.primary,
                },
                {backgroundColor: theme.colors.surface},
              ]}
              onPress={() => setSelectedCategory(cat.key)}>
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text
                style={[
                  styles.categoryText,
                  {
                    color:
                      selectedCategory === cat.key
                        ? '#fff'
                        : theme.colors.text,
                  },
                ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Apps List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Deine Apps
          </Text>
          {filteredApps.length === 0 ? (
            <Card>
              <Text
                style={[
                  styles.emptyText,
                  {color: theme.colors.textSecondary},
                ]}>
                Keine Apps gefunden
              </Text>
            </Card>
          ) : (
            filteredApps.map(app => (
              <AppUsageCard
                key={app.packageName}
                app={app}
                onToggleBlock={() => handleToggleBlock(app.packageName)}
              />
            ))
          )}
        </View>

        {/* Active Rules */}
        {rules.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
              Aktive Regeln
            </Text>
            {rules.map(rule => (
              <Card key={rule.id} style={styles.ruleCard}>
                <View style={styles.ruleHeader}>
                  <View>
                    <Text
                      style={[styles.ruleAppName, {color: theme.colors.text}]}>
                      {rule.appName}
                    </Text>
                    <Text
                      style={[
                        styles.ruleType,
                        {color: theme.colors.textSecondary},
                      ]}>
                      {rule.type === 'limit'
                        ? `Limit: ${rule.dailyLimit}min`
                        : rule.type === 'schedule'
                        ? `Zeitplan: ${rule.schedule?.startTime}-${rule.schedule?.endTime}`
                        : 'Permanent blockiert'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => dispatch(toggleRule(rule.id))}
                    style={[
                      styles.ruleToggle,
                      {
                        backgroundColor: rule.isActive
                          ? theme.colors.success + '20'
                          : theme.colors.border,
                      },
                    ]}>
                    <Text
                      style={{
                        color: rule.isActive
                          ? theme.colors.success
                          : theme.colors.textSecondary,
                      }}>
                      {rule.isActive ? '✓' : '○'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => dispatch(deleteRule(rule.id))}
                  style={styles.deleteButton}>
                  <Text style={{color: theme.colors.error}}>Löschen</Text>
                </TouchableOpacity>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {backgroundColor: theme.colors.background},
            ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: theme.colors.text}]}>
                Regel hinzufügen
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={{color: theme.colors.textSecondary}}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text
              style={[styles.modalSubtitle, {color: theme.colors.textSecondary}]}>
              Wähle eine App zum Blockieren
            </Text>
            <ScrollView>
              {appUsages
                .filter(app => !app.isBlocked)
                .map(app => (
                  <TouchableOpacity
                    key={app.packageName}
                    style={[
                      styles.modalItem,
                      {borderBottomColor: theme.colors.border},
                    ]}
                    onPress={() => handleAddRule(app)}>
                    <Text style={{color: theme.colors.text}}>
                      {app.appName}
                    </Text>
                    <Text style={{color: theme.colors.primary}}>+</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  summaryCard: {
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  searchInput: {
    marginBottom: 12,
  },
  categoryScroll: {
    marginBottom: 20,
  },
  categoryContent: {
    paddingRight: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 24,
  },
  ruleCard: {
    marginBottom: 12,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ruleAppName: {
    fontSize: 16,
    fontWeight: '600',
  },
  ruleType: {
    fontSize: 12,
    marginTop: 2,
  },
  ruleToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    alignSelf: 'flex-start',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
});

export default AppBlockerScreen;
