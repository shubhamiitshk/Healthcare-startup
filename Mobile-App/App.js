import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import store, { persistor } from './src/store/store';
import { ActivityIndicator, Text, View, StyleSheet, Animated,Pressable,Dimensions } from 'react-native';
import { House, Calendar } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


// Import Screens
import RegisterScreen from './screens/RegisterScreen';
import OTPScreen from './screens/OTPScreen';
import ProfileScreen from './screens/ProfileScreen';
import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import DoctorProfile from './screens/DoctorProfile';
import AppointmentReceipt from './screens/AppointmentReceipt';
import AppointmentsScreen from './screens/AppointmentsScreen';
import UserProfile from './screens/UserProfile';
import SplashScreen from './screens/SplashScreen'; // Import your animated splash screen

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const { height } = Dimensions.get('window');

// Main Tabs Component
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        height: 70,
        position: 'relative',
      },
    })}
    tabBar={CustomTabBar}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Appointments" component={AppointmentsScreen} />
  </Tab.Navigator>
);

// Custom Tab Bar Component
const CustomTabBar = ({ state, descriptors, navigation }) => {
  const [translateX] = React.useState(new Animated.Value(0));
  const [indicatorWidth, setIndicatorWidth] = React.useState([]);
  const [indicatorPosition, setIndicatorPosition] = React.useState([]);

  React.useEffect(() => {
    if (indicatorWidth[state.index] != null && indicatorPosition[state.index] != null) {
      Animated.timing(translateX, {
        toValue: indicatorPosition[state.index],
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [state.index, indicatorWidth, indicatorPosition, translateX]);

  const updateIndicatorMetrics = (index, width, position) => {
    setIndicatorWidth((prev) => {
      const updated = [...prev];
      updated[index] = width;
      return updated;
    });
    setIndicatorPosition((prev) => {
      const updated = [...prev];
      updated[index] = position;
      return updated;
    });
  };

  return (
    <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#fff', paddingBottom: 0 }}>
      <View style={[styles.tabBar, { backgroundColor: 'transparent', borderTopWidth: 0 }]}>
        {/* Active Indicator */}
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              width: indicatorWidth[state.index] || 0,
              transform: [{ translateX }],
            },
          ]}
        />

        {state.routes.map((route, index) => {
          const label = route.name === 'Home' ? 'Home' : 'Appointments';

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <React.Fragment key={index}>
              <Pressable
                style={styles.tabContainer}
                onPress={onPress}
                onLayout={(event) => {
                  const { width, x } = event.nativeEvent.layout;
                  if (!indicatorWidth[index] || !indicatorPosition[index]) {
                    updateIndicatorMetrics(index, width * 0.6, x + width * 0.2);
                  }
                }}
              >
                {label === 'Home' ? (
                  <House size={20} color={isFocused ? '#1BBA8D' : '#000'} />
                ) : (
                  <Calendar size={20} color={isFocused ? '#1BBA8D' : '#000'} />
                )}
                <Text style={[styles.tabLabel, { color: isFocused ? '#000' : '#000' }]}>
                  {label}
                </Text>
              </Pressable>

              {/* Divider Line */}
              {index === 0 && <View style={styles.divider} />}
            </React.Fragment>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

// App Stack Component
const AppStack = () => {
  const isLoggedIn = useSelector((state) => !!state.auth.authToken); // Check if user is logged in
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setShowSplash(false);
    }, 2500); // Splash screen duration
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }


  return (
    <NavigationContainer>
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={isLoggedIn ? 'MainTabs' : 'RegisterScreen'} // Set initial route based on login status
    >
      {/* Common Screens */}
      <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
      <Stack.Screen name="OTPScreen" component={OTPScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />

      {/* Screens for Logged-In Users */}
      {isLoggedIn && (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="SearchScreen" component={SearchScreen} />
          <Stack.Screen name="DoctorProfile" component={DoctorProfile} />
          <Stack.Screen name="AppointmentReceipt" component={AppointmentReceipt} />
          <Stack.Screen name="UserProfile" component={UserProfile} />
        </>
      )}
    </Stack.Navigator>
  </NavigationContainer>



  );
};

// Root App Component
export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<ActivityIndicator />} persistor={persistor}>
        <AppStack />
      </PersistGate>
    </Provider>
  );
}

// Styles
const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    height: height * 0.07,
    alignItems: 'center',
    position: 'relative',
    elevation: 0,
  },
  tabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  activeIndicator: {
    height: 4,
    backgroundColor: '#1BBA8D',
    position: 'absolute',
    top: 0,
    borderRadius: 2,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#ddd',
    alignSelf: 'center',
  },
});
