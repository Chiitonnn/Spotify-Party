import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  StatusBar, SafeAreaView, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../contexts/SessionContext';
import * as SessionService from '../services/session.service';

const JoinSessionScreen = ({ navigation }) => {
  const { setCurrentSession } = useSession();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const handleJoin = async () => {
    if (code.length < 4) return;
    try {
      setLoading(true);
      const session = await SessionService.joinSession(code.toUpperCase());
      setCurrentSession(session);
      navigation.replace('Session', { sessionId: session._id });
    } catch (error) {
      Alert.alert('Inexistant', 'Aucun salon ne correspond à ce code.');
    } finally {
      setLoading(false);
    }
  };

  const renderBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      const char = code[i] || '';
      const isFocused = i === code.length;
      boxes.push(
        <View key={i} style={[styles.box, char ? styles.boxFilled : null, isFocused ? styles.boxActive : null]}>
          <Text style={styles.boxText}>{char}</Text>
          {isFocused && <View style={styles.cursor} />}
        </View>
      );
    }
    return boxes;
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
            <View style={styles.badge}>
              <Ionicons name="people" size={14} color="#1DB954" />
              <Text style={styles.badgeText}>REJOINDRE DES AMIS</Text>
            </View>

            <Text style={styles.title}>Code d'accès</Text>
            <Text style={styles.subtitle}>Saisissez le code de 6 caractères qui s'affiche sur l'appareil de l'hôte.</Text>

            <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()} style={styles.boxesRow}>
              {renderBoxes()}
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              keyboardAppearance="dark"
              autoFocus={true}
            />

            <View style={styles.tip}>
              <Ionicons name="information-circle-outline" size={16} color="#444" />
              <Text style={styles.tipText}>Le code est personnel à chaque session.</Text>
            </View>
          </KeyboardAvoidingView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.btn, (loading || code.length < 4) && styles.btnDisabled]}
              onPress={handleJoin}
              disabled={loading || code.length < 4}
            >
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>VALIDER LE CODE</Text>}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#282828' },
  
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(29, 185, 84, 0.1)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, marginBottom: 20 },
  badgeText: { color: '#1DB954', fontSize: 10, fontWeight: '900', marginLeft: 6, letterSpacing: 1.2 },
  
  title: { color: '#FFF', fontSize: 32, fontWeight: '800', marginBottom: 12 },
  subtitle: { color: '#B3B3B3', fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 50 },
  
  boxesRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 30 },
  box: { width: 44, height: 62, backgroundColor: '#121212', borderRadius: 12, borderWidth: 1, borderColor: '#282828', justifyContent: 'center', alignItems: 'center' },
  boxFilled: { borderColor: '#444' },
  boxActive: { borderColor: '#1DB954' },
  boxText: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  cursor: { width: 2, height: 24, backgroundColor: '#1DB954' },
  hiddenInput: { position: 'absolute', width: 0, height: 0, opacity: 0 },
  
  tip: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipText: { color: '#444', fontSize: 13, fontWeight: '600' },

  footer: { padding: 25 },
  btn: { backgroundColor: '#1DB954', height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', shadowColor: '#1DB954', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 },
  btnDisabled: { backgroundColor: '#121212', opacity: 0.5 },
  btnText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 }
});

export default JoinSessionScreen;