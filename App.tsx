import React from 'react';
import {SafeAreaView, StatusBar, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {BleProvider} from './src/contexts/BleContext';
import {SessionProvider} from './src/contexts/SessionContext';
import AppNavigator from './src/navigation/AppNavigator';
import {COLORS} from './src/constants/theme';

const App: React.FC = () => {
  return (
    <BleProvider>
      <SessionProvider>
        <NavigationContainer>
          <SafeAreaView style={styles.container}>
            <StatusBar
              barStyle="light-content"
              backgroundColor={COLORS.background.dark}
            />
            <AppNavigator />
          </SafeAreaView>
        </NavigationContainer>
      </SessionProvider>
    </BleProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
  },
});

export default App;
