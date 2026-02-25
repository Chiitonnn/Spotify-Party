import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import CreateSessionScreen from '../screens/CreateSessionScreen';
import JoinSessionScreen from '../screens/JoinSessionScreen';
import SessionScreen from '../screens/SessionScreen';
import VoteScreen from '../screens/VoteScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#000',
          elevation: 0,
          shadowOpacity: 0
        },
        headerTintColor: '#1DB954',
        headerTitleStyle: {
          fontWeight: 'bold'
        },
        cardStyle: { backgroundColor: '#000' }
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Spotify Party' }}
      />
      <Stack.Screen 
        name="CreateSession" 
        component={CreateSessionScreen}
        options={{ title: 'Créer une session' }}
      />
      <Stack.Screen 
        name="JoinSession" 
        component={JoinSessionScreen}
        options={{ title: 'Rejoindre' }}
      />
      <Stack.Screen 
        name="Session" 
        component={SessionScreen}
        options={{ title: 'Session' }}
      />
      <Stack.Screen 
        name="Vote" 
        component={VoteScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;