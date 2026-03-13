import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {useTheme} from '../theme/ThemeContext';

export const LoadingScreen: React.FC = () => {
  const {theme} = useTheme();

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: theme.colors.background},
      ]}>
      <Text style={styles.logoIcon}>🎯</Text>
      <Text style={[styles.logoText, {color: theme.colors.text}]}>
        FocusFlow
      </Text>
      <ActivityIndicator
        size="large"
        color={theme.colors.primary}
        style={styles.loader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 24,
  },
  loader: {
    marginTop: 16,
  },
});

export default LoadingScreen;
