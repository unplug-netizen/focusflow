import React, {useEffect} from 'react';
import {Text} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {Provider, useDispatch, useSelector} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {store, persistor, AppDispatch, RootState} from './src/store';
import {signInAnonymously} from './src/store/slices/authSlice';
import {ThemeProvider, useTheme} from './src/theme/ThemeContext';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import AppBlockerScreen from './src/screens/AppBlockerScreen';
import FocusModeScreen from './src/screens/FocusModeScreen';
import StatsScreen from './src/screens/StatsScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tab bar icon component
const TabIcon: React.FC<{focused: boolean; icon: string; label: string}> = ({
  focused,
  icon,
  label,
}) => {
  const {theme} = useTheme();
  return (
    <Text
      style={{
        fontSize: focused ? 24 : 20,
        opacity: focused ? 1 : 0.6,
        color: focused ? theme.colors.primary : theme.colors.textSecondary,
      }}>
      {icon}
    </Text>
  );
};

function MainTabs() {
  const {theme} = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon="🏠" label="Home" />
          ),
        }}
      />
      <Tab.Screen
        name="Blocker"
        component={AppBlockerScreen}
        options={{
          tabBarLabel: 'Blocker',
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon="🚫" label="Blocker" />
          ),
        }}
      />
      <Tab.Screen
        name="Focus"
        component={FocusModeScreen}
        options={{
          tabBarLabel: 'Fokus',
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon="🎯" label="Fokus" />
          ),
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon="📊" label="Stats" />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({focused}) => (
            <TabIcon focused={focused} icon="👤" label="Profil" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Auth Navigator
function AuthNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

// Wrapper component to access theme in MainTabs and handle auth
function AppContent(): React.JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
  const {isAuthenticated, isLoading} = useSelector(
    (state: RootState) => state.auth
  );

  // Auto-sign in anonymously on app start if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      dispatch(signInAnonymously());
    }
  }, [dispatch, isAuthenticated, isLoading]);

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="Leaderboard"
            component={LeaderboardScreen}
            options={{
              presentation: 'modal',
            }}
          />
        </Stack.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
