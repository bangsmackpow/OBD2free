import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import {Text, View} from 'react-native';
import {COLORS, SIZES} from '../constants';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const DashboardStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: COLORS.background.darker},
        headerTintColor: COLORS.text.primary,
        headerTitleStyle: {fontWeight: 'bold'},
      }}>
      <Stack.Screen
        name="DashboardMain"
        component={DashboardScreen}
        options={{title: 'OBD2Free'}}
      />
    </Stack.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {backgroundColor: COLORS.background.darker},
          tabBarActiveTintColor: COLORS.neon.blue,
          tabBarInactiveTintColor: COLORS.text.muted,
          headerShown: false,
        }}>
        <Tab.Screen name="Dashboard" component={DashboardStack} />
        <Tab.Screen
          name="Sessions"
          component={PlaceholderScreen}
          options={{title: 'Sessions'}}
        />
        <Tab.Screen
          name="Settings"
          component={PlaceholderScreen}
          options={{title: 'Settings'}}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const PlaceholderScreen: React.FC = ({route}: any) => (
  <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background.dark}}>
    <Text style={{color: COLORS.text.secondary, fontSize: SIZES.lg}}>
      {route.name} - Coming Soon
    </Text>
  </View>
);

export default AppNavigator;
