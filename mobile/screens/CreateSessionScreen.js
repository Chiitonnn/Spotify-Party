import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../contexts/SessionContext';
import * as SessionService from '../services/session.service';

const CreateSessionScreen = ({ navigation }) => {
  const { setCurrentSession } = useSession();
  const [sessionName, setSessionName] = useState('Spotify Party');
  const [mode, setMode] = useState('classic'); // 'classic' ou 'vote'
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleCreate = async () => {
    if (!sessionName.trim()) {
      Alert.alert('Oups', 'Le nom de la session ne peut pas être vide.');
      return;
    }
    try {
      setLoading(true);
      const session = await SessionService.createSession({
        name: sessionName,
        mode: mode,
        playlistIds: [], votingThreshold: 1, trackLimit: 50 
      });
      setCurrentSession(session);
      navigation.replace('Session', { sessionId: session._id });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de générer le salon.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={26} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>CRÉER</Text>
              <View style={{ width: 40 }} />
            </View>

            <View style={styles.hero}>
              <View style={styles.iconGlow}>
                <View style={styles.iconCircle}>
                  <Ionicons name="musical-note" size={40} color="#1DB954" />
                </View>
              </View>
              <Text style={styles.title}>Lancez le mouvement</Text>
              <Text style={styles.subtitle}>
                Un espace partagé où chaque invité peut enrichir la file d'attente.
              </Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.inputLabel}>NOM DE LA SOIRÉE</Text>
              <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
                <TextInput
                  style={styles.input}
                  value={sessionName}
                  onChangeText={setSessionName}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholderTextColor="#444"
                  selectionColor="#1DB954"
                />
              </View>

              <Text style={[styles.inputLabel, { marginTop: 25 }]}>MODE DE JEU</Text>
              <View style={styles.modeContainer}>
                <TouchableOpacity 
                  style={[styles.modeCard, mode === 'classic' && styles.modeCardActive]} 
                  onPress={() => setMode('classic')}
                >
                  <View style={[styles.radio, mode === 'classic' && styles.radioActive]}>
                    {mode === 'classic' && <View style={styles.radioInner} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modeTitle}>Mode Classique</Text>
                    <Text style={styles.modeDesc}>File d'attente collaborative standard.</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modeCard, mode === 'vote' && styles.modeCardActive]} 
                  onPress={() => setMode('vote')}
                >
                  <View style={[styles.radio, mode === 'vote' && styles.radioActive]}>
                    {mode === 'vote' && <View style={styles.radioInner} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modeTitle}>Mode Vote (Skip)</Text>
                    <Text style={styles.modeDesc}>Tout le monde propose 10 sons, puis vote pour passer ou garder.</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name="flash-sharp" size={20} color="#1DB954" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Le saviez-vous ?</Text>
                <Text style={styles.cardText}>
                  Une fois créée, partagez simplement le code à 6 chiffres. Vos amis rejoignent en un clic.
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.mainButton, loading && styles.buttonDisabled]}
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.mainButtonText}>CRÉER LA SESSION</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { color: '#666', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  
  hero: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
  iconGlow: { shadowColor: '#1DB954', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 20 },
  iconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#282828' },
  title: { color: '#FFF', fontSize: 28, fontWeight: '800', marginTop: 25, marginBottom: 10 },
  subtitle: { color: '#B3B3B3', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  
  form: { marginBottom: 30 },
  inputLabel: { color: '#555', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 12 },
  inputContainer: { backgroundColor: '#121212', borderRadius: 16, borderWidth: 1, borderColor: '#282828', height: 65, justifyContent: 'center', paddingHorizontal: 20 },
  inputContainerFocused: { borderColor: '#1DB954', backgroundColor: '#181818' },
  input: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  
  modeContainer: { gap: 12 },
  modeCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#121212', 
    borderRadius: 16, 
    padding: 18, 
    borderWidth: 1, 
    borderColor: '#282828',
    gap: 15
  },
  modeCardActive: { borderColor: '#1DB954', backgroundColor: '#181818' },
  modeTitle: { color: '#FFF', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  modeDesc: { color: '#666', fontSize: 13 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#444', justifyContent: 'center', alignItems: 'center' },
  radioActive: { borderColor: '#1DB954' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1DB954' },

  card: { backgroundColor: '#121212', borderRadius: 20, padding: 20, flexDirection: 'row', gap: 15, borderWidth: 1, borderColor: '#282828' },
  cardIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(29, 185, 84, 0.1)', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { color: '#FFF', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  cardText: { color: '#B3B3B3', fontSize: 13, lineHeight: 18 },

  footer: { padding: 25, position: 'absolute', bottom: 0, left: 0, right: 0 },
  mainButton: { backgroundColor: '#1DB954', height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#1DB954', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 10 },
  mainButtonText: { color: '#000', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  buttonDisabled: { opacity: 0.6 }
});

export default CreateSessionScreen;