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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color="#B3B3B3" />
              </View>
            )}
            <View style={styles.textInfo}>
              <Text style={styles.greeting}>Bonjour,</Text>
              <Text style={styles.username}>{user?.displayName || 'Invité'}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* CONTENU PRINCIPAL */}
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Prêt pour la soirée ?</Text>
          <Text style={styles.sectionSubtitle}>Choisissez comment vous souhaitez participer.</Text>

          <View style={styles.cardsContainer}>
            {/* CARTE CRÉER (L'Hôte) */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('CreateSession')}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: 'rgba(29, 185, 84, 0.1)' }]}>
                <Ionicons name="add" size={28} color="#1DB954" />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Créer un salon</Text>
                <Text style={styles.cardSubtitle}>Devenez l'hôte de la soirée</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#333" />
            </TouchableOpacity>

            {/* CARTE REJOINDRE (L'Invité) */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('JoinSession')}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: '#1A1A1A' }]}>
                <Ionicons name="enter-outline" size={26} color="#FFF" />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>Rejoindre un salon</Text>
                <Text style={styles.cardSubtitle}>Entrez le code d'un ami</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#333" />
            </TouchableOpacity>
          </View>

          {/* MESSAGE PREMIUM (si applicable) */}
          {!user?.isPremium && (
            <View style={styles.premiumNotice}>
              <Ionicons name="information-circle-outline" size={20} color="#B3B3B3" />
              <Text style={styles.premiumText}>
                Un compte Spotify Premium est requis pour créer un salon.
              </Text>
            </View>
          )}
        </View>

      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 40,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 15,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E1E1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textInfo: {
    justifyContent: 'center',
  },
  greeting: {
    color: '#B3B3B3',
    fontSize: 14,
  },
  username: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutBtn: {
    padding: 10,
    backgroundColor: '#121212',
    borderRadius: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: '#B3B3B3',
    fontSize: 15,
    marginBottom: 35,
  },
  cardsContainer: {
    gap: 15,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#282828',
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#B3B3B3',
    fontSize: 14,
  },
  premiumNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    padding: 15,
    backgroundColor: '#121212',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#282828',
    gap: 10,
  },
  premiumText: {
    color: '#B3B3B3',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});

export default HomeScreen;