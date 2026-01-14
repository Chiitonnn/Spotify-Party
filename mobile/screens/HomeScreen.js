import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <View style={styles.headerUser}>
          <View style={styles.avatarContainer}>
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatar} />
            ) : (
              <Ionicons name="person" size={24} color="#B3B3B3" />
            )}
          </View>
          <View>
            <Text style={styles.greeting}>Bonjour,</Text>
            <Text style={styles.username}>{user?.displayName || 'Invité'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#FF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Que voulez-vous faire ?</Text>
        
        <View style={styles.grid}>
          {/* Card Créer */}
          <TouchableOpacity
            style={[styles.card, styles.cardPrimary]}
            onPress={() => navigation.navigate('CreateSession')}
            activeOpacity={0.9}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="add" size={32} color="#000" />
            </View>
            <Text style={styles.cardTitle}>Créer une Session</Text>
            <Text style={styles.cardSubtitle}>Devenez l'hôte</Text>
          </TouchableOpacity>

          {/* Card Rejoindre */}
          <TouchableOpacity
            style={[styles.card, styles.cardSecondary]}
            onPress={() => navigation.navigate('JoinSession')} // Assure-toi d'avoir cet écran
            activeOpacity={0.9}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#333' }]}>
              <Ionicons name="enter-outline" size={32} color="#FFF" />
            </View>
            <Text style={styles.cardTitle}>Rejoindre</Text>
            <Text style={styles.cardSubtitle}>Entrer un code</Text>
          </TouchableOpacity>
        </View>

        {!user?.isPremium && (
          <View style={styles.warningContainer}>
            <Ionicons name="warning" size={20} color="#FFA500" />
            <Text style={styles.warningText}>
              Compte Premium requis pour être hôte.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 40
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40
  },
  headerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#282828',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  avatar: { width: '100%', height: '100%' },
  greeting: { color: '#B3B3B3', fontSize: 14 },
  username: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  logoutBtn: {
    padding: 10,
    backgroundColor: '#121212',
    borderRadius: 20
  },
  
  content: { paddingHorizontal: 20 },
  sectionTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  
  grid: { gap: 20 },
  
  card: {
    padding: 25,
    borderRadius: 20,
    height: 160,
    justifyContent: 'space-between'
  },
  cardPrimary: { backgroundColor: '#1DB954' },
  cardSecondary: { backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: '#333' },
  
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  
  cardTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  cardSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
  
  warningContainer: {
    marginTop: 30,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.3)'
  },
  warningText: { color: '#FFA500', fontSize: 14 }
});

export default HomeScreen;